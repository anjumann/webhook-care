/**
 * Endpoint service — all Prisma access + business logic for endpoints.
 * Routes/jobs/MCP call these; they never query Prisma directly.
 */
import { prisma } from "@/lib/prisma";
import { listRequests, type ListRequestsParams } from "@/services/requests";

/** URL-safe endpoint name: spaces → `-`, strip anything outside [a-zA-Z0-9_-]. */
export function sanitizeName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9_-]/g, "");
}

export function listEndpoints(userId: string) {
  return prisma.endpoint.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { forwardingUrls: true },
  });
}

/** Lightweight lookup the public webhook ingest uses on its hot path. */
export function findEndpointForIngest(userId: string, name: string) {
  return prisma.endpoint.findFirst({
    where: { userId, name },
    select: {
      id: true,
      retentionDays: true,
      forwardingUrls: { select: { url: true } },
    },
  });
}

/** Resolve an endpoint by name first, then by id (both URL forms resolve). */
export async function findEndpoint(idOrName: string) {
  return (
    (await prisma.endpoint.findFirst({
      where: { name: idOrName },
      include: { forwardingUrls: true },
    })) ??
    (await prisma.endpoint.findUnique({
      where: { id: idOrName },
      include: { forwardingUrls: true },
    }))
  );
}

/**
 * Endpoint + a first page of requests. Replaces the old unbounded
 * `include: { requests }` so the detail page never loads everything.
 */
export async function findEndpointWithRequests(
  idOrName: string,
  pageParams: ListRequestsParams = {}
) {
  const endpoint = await findEndpoint(idOrName);
  if (!endpoint) return null;
  const page = await listRequests(endpoint.id, pageParams);
  return { ...endpoint, requests: page.items, nextCursor: page.nextCursor };
}

export function createEndpoint(input: {
  userId: string;
  name: string;
  description?: string;
  forwardingUrls?: { url: string; method: string }[];
}) {
  return prisma.endpoint.create({
    data: {
      name: sanitizeName(input.name),
      description: input.description,
      forwardingUrls: {
        create: (input.forwardingUrls ?? []).map((r) => ({
          url: r.url,
          method: r.method,
        })),
      },
      user: { connect: { userId: input.userId } },
    },
    include: { forwardingUrls: true },
  });
}

/**
 * Replace an endpoint's forwarding URLs atomically with the update so a partial
 * failure can't wipe forwarding (the old route deleted-then-recreated outside a
 * transaction).
 */
export async function updateEndpoint(
  id: string,
  input: {
    name?: string;
    description?: string;
    retentionDays?: number;
    forwardingUrls?: { url: string; method: string }[];
  }
) {
  const data: {
    name?: string;
    description?: string;
    retentionDays?: number;
  } = {};
  if (input.name !== undefined) data.name = sanitizeName(input.name);
  if (input.description !== undefined) data.description = input.description;
  if (input.retentionDays !== undefined) data.retentionDays = input.retentionDays;

  const ops = [];
  if (input.forwardingUrls) {
    ops.push(prisma.forwardingUrl.deleteMany({ where: { endpointId: id } }));
  }
  ops.push(
    prisma.endpoint.update({
      where: { id },
      data: {
        ...data,
        ...(input.forwardingUrls
          ? { forwardingUrls: { create: input.forwardingUrls } }
          : {}),
      },
      include: { forwardingUrls: true },
    })
  );

  const results = await prisma.$transaction(ops);
  return results[results.length - 1];
}

export function deleteEndpoint(id: string) {
  return prisma.endpoint.delete({ where: { id } });
}

/** Owner check for guards: does this endpoint belong to this userId? */
export async function isEndpointOwnedBy(
  endpointId: string,
  userId: string
): Promise<boolean> {
  const found = await prisma.endpoint.findFirst({
    where: { id: endpointId, userId },
    select: { id: true },
  });
  return found !== null;
}
