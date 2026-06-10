/**
 * Request service — captured-webhook reads/writes.
 *
 * Lists are ALWAYS bounded and cursor-paginated (the Request table is unbounded
 * in production). Cursor = the last item's id; ordering is (createdAt desc, id
 * desc) which is backed by the `@@index([endpointId, createdAt])`.
 */
import { prisma } from "@/lib/prisma";
import type { Prisma, Request as PrismaRequest } from "../../generated/prisma/client";

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_RETENTION_DAYS = 30;

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

/** Fields the live relay streams to a local `wcat listen` client. */
const RELAY_SELECT = {
  id: true,
  method: true,
  headers: true,
  body: true,
  rawBody: true,
  contentType: true,
  query: true,
  createdAt: true,
} satisfies Prisma.RequestSelect;

export type RelayRequest = Prisma.RequestGetPayload<{ select: typeof RELAY_SELECT }>;

/**
 * The id of the newest request for an endpoint, or null when it has none yet.
 * The live relay uses this as its *starting* cursor so a fresh `wcat listen`
 * only forwards captures that arrive after it connects — it never replays
 * history. Backed by the `([endpointId, createdAt])` index.
 */
export async function latestRequestId(
  endpointId: string
): Promise<string | null> {
  const row = await prisma.request.findFirst({
    where: { endpointId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: { id: true },
  });
  return row?.id ?? null;
}

/**
 * Tail an endpoint's requests *forward* in time for the live relay: rows
 * strictly after `afterId`, oldest-first, bounded by `take`. The cursor is the
 * last delivered id, so a reconnecting listener resumes exactly where it left
 * off — that closes the gap across the SSE stream's max-duration reconnect
 * without ever loading the unbounded table.
 */
export function requestsAfter(
  endpointId: string,
  afterId: string | null,
  take = 50
): Promise<RelayRequest[]> {
  return prisma.request.findMany({
    where: { endpointId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: Math.min(Math.max(1, take), 200),
    ...(afterId ? { cursor: { id: afterId }, skip: 1 } : {}),
    select: RELAY_SELECT,
  });
}

export interface CursorRange {
  since?: Date;
  until?: Date;
  batchSize?: number;
}

/**
 * Stream an endpoint's requests in bounded cursor batches (newest first) for
 * export. Never loads the whole table — each `yield` is at most `batchSize`
 * rows, paginated by the same `(createdAt desc, id desc)` keyset as the UI.
 */
export async function* cursorRequests(
  endpointId: string,
  range: CursorRange = {}
): AsyncGenerator<PrismaRequest[]> {
  const batchSize = Math.min(Math.max(1, range.batchSize ?? 500), 1000);

  const createdAt: Prisma.DateTimeFilter = {};
  if (range.since) createdAt.gte = range.since;
  if (range.until) createdAt.lte = range.until;
  const where: Prisma.RequestWhereInput = { endpointId };
  if (range.since || range.until) where.createdAt = createdAt;

  let cursor: string | null = null;
  for (;;) {
    const batch: PrismaRequest[] = await prisma.request.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: batchSize,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    if (batch.length === 0) return;
    yield batch;
    if (batch.length < batchSize) return;
    cursor = batch[batch.length - 1]!.id;
  }
}

export function deleteRequest(id: string) {
  return prisma.request.delete({ where: { id } });
}

export function deleteAllRequests(endpointId: string) {
  return prisma.request.deleteMany({ where: { endpointId } });
}

/**
 * Pin / unpin a request.
 *
 * `expiresAt` is the single source of truth for "when this request is swept"
 * (used by both the nightly job and the Mongo TTL safety-net index). Pinning
 * nulls it out so the row is exempt from *both*; unpinning recomputes it from
 * the endpoint's retention window so the request rejoins the sweep.
 */
export async function setPinned(id: string, pinned: boolean) {
  if (pinned) {
    return prisma.request.update({
      where: { id },
      data: { pinned: true, expiresAt: null },
    });
  }

  const req = await prisma.request.findUnique({
    where: { id },
    select: { createdAt: true, endpoint: { select: { retentionDays: true } } },
  });
  // Let Prisma throw the canonical P2025 if the row is gone.
  if (!req) return prisma.request.update({ where: { id }, data: { pinned: false } });

  const days = req.endpoint?.retentionDays ?? DEFAULT_RETENTION_DAYS;
  const expiresAt = new Date(req.createdAt.getTime() + days * DAY_MS);
  return prisma.request.update({
    where: { id },
    data: { pinned: false, expiresAt },
  });
}

export interface SweepOptions {
  now?: Date;
  /** Rows deleted per pass (bounded so one job never loads the whole table). */
  batchSize?: number;
  /** Safety cap on passes per invocation; the QStash schedule retries daily. */
  maxBatches?: number;
  /** Count what *would* be deleted without deleting (for pre-launch dry runs). */
  dryRun?: boolean;
}

export interface SweepResult {
  deleted: number;
  /** In a dry run this is the would-delete count; otherwise equals `deleted`. */
  wouldDelete: number;
  passes: number;
  dryRun: boolean;
}

/**
 * Delete expired, **unpinned** requests in bounded batches.
 *
 * Pinned rows already have a null `expiresAt` (see `setPinned`) so they never
 * match, but we filter on `pinned` too as belt-and-suspenders. The batched
 * find→deleteMany loop keeps each pass O(batchSize) instead of loading every
 * expired row at once.
 */
export async function deleteExpiredRequests(
  opts: SweepOptions = {}
): Promise<SweepResult> {
  const now = opts.now ?? new Date();
  const where: Prisma.RequestWhereInput = {
    pinned: false,
    expiresAt: { lte: now }, // nulls never satisfy `lte`, so pinned rows are excluded
  };

  if (opts.dryRun) {
    const wouldDelete = await prisma.request.count({ where });
    return { deleted: 0, wouldDelete, passes: 0, dryRun: true };
  }

  const batchSize = Math.min(Math.max(1, opts.batchSize ?? 1000), 5000);
  const maxBatches = opts.maxBatches ?? 100;

  let deleted = 0;
  let passes = 0;
  while (passes < maxBatches) {
    const batch = await prisma.request.findMany({
      where,
      select: { id: true },
      take: batchSize,
    });
    if (batch.length === 0) break;

    const res = await prisma.request.deleteMany({
      where: { id: { in: batch.map((r) => r.id) } },
    });
    deleted += res.count;
    passes++;
    if (batch.length < batchSize) break; // last (partial) page → done
  }

  return { deleted, wouldDelete: deleted, passes, dryRun: false };
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
