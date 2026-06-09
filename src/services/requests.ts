/**
 * Request service — captured-webhook reads/writes.
 *
 * Lists are ALWAYS bounded and cursor-paginated (the Request table is unbounded
 * in production). Cursor = the last item's id; ordering is (createdAt desc, id
 * desc) which is backed by the `@@index([endpointId, createdAt])`.
 */
import { prisma } from "@/lib/prisma";
import type { Prisma } from "../../generated/prisma/client";

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

export interface ListRequestsParams {
  limit?: number;
  cursor?: string | null;
  method?: string;
  status?: number;
  since?: Date;
}

export function clampLimit(limit?: number): number {
  if (!limit || Number.isNaN(limit)) return DEFAULT_PAGE_SIZE;
  return Math.min(Math.max(1, Math.floor(limit)), MAX_PAGE_SIZE);
}

export async function listRequests(
  endpointId: string,
  params: ListRequestsParams = {}
) {
  const take = clampLimit(params.limit);

  const where: Prisma.RequestWhereInput = { endpointId };
  if (params.method) where.method = params.method.toUpperCase();
  if (typeof params.status === "number") where.statusCode = params.status;
  if (params.since) where.createdAt = { gte: params.since };

  const items = await prisma.request.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: take + 1, // fetch one extra to know if there's a next page
    ...(params.cursor
      ? { cursor: { id: params.cursor }, skip: 1 }
      : {}),
  });

  const hasMore = items.length > take;
  const page = hasMore ? items.slice(0, take) : items;
  return {
    items: page,
    nextCursor: hasMore ? page[page.length - 1]!.id : null,
  };
}

export function getRequest(id: string) {
  return prisma.request.findUnique({ where: { id } });
}

export function deleteRequest(id: string) {
  return prisma.request.delete({ where: { id } });
}

export function deleteAllRequests(endpointId: string) {
  return prisma.request.deleteMany({ where: { endpointId } });
}

export function setPinned(id: string, pinned: boolean) {
  return prisma.request.update({ where: { id }, data: { pinned } });
}

export interface CaptureRequestInput {
  endpointId: string;
  method: string;
  // JSON-ish values (already redacted by the caller); cast to Prisma's JSON type.
  headers: unknown;
  body?: unknown;
  rawBody?: string | null;
  contentType?: string | null;
  query?: unknown;
  response?: unknown;
  statusCode: number;
  duration: number;
  expiresAt?: Date | null;
}

const json = (v: unknown) => v as Prisma.InputJsonValue;

/**
 * Persist a captured webhook and bump the endpoint counter in a single
 * transaction so the request log and `requestCount` never drift.
 */
export function captureRequest(input: CaptureRequestInput) {
  return prisma.$transaction([
    prisma.request.create({
      data: {
        endpointId: input.endpointId,
        method: input.method,
        headers: json(input.headers),
        body: input.body === undefined ? undefined : json(input.body),
        rawBody: input.rawBody ?? undefined,
        contentType: input.contentType ?? undefined,
        query: input.query === undefined ? undefined : json(input.query),
        response: input.response === undefined ? undefined : json(input.response),
        statusCode: input.statusCode,
        duration: input.duration,
        expiresAt: input.expiresAt ?? undefined,
      },
    }),
    prisma.endpoint.update({
      where: { id: input.endpointId },
      data: { lastActivity: new Date(), requestCount: { increment: 1 } },
    }),
  ]);
}
