import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Prisma singleton so unit tests never touch a real database.
// `vi.hoisted` makes the mock available to the hoisted `vi.mock` factory.
const prismaMock = vi.hoisted(() => ({
  request: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
  },
  endpoint: {
    update: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import {
  clampLimit,
  listRequests,
  buildRequestSearchFilter,
  liveRequestsAfter,
  captureRequest,
  setPinned,
  deleteExpiredRequests,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from "@/services/requests";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("clampLimit", () => {
  it("falls back to the default for missing/NaN/zero (treated as 'no limit given')", () => {
    expect(clampLimit()).toBe(DEFAULT_PAGE_SIZE);
    expect(clampLimit(Number.NaN)).toBe(DEFAULT_PAGE_SIZE);
    expect(clampLimit(0)).toBe(DEFAULT_PAGE_SIZE);
  });
  it("clamps positives to [1, MAX_PAGE_SIZE] and floors fractions", () => {
    expect(clampLimit(-5)).toBe(1);
    expect(clampLimit(10.9)).toBe(10);
    expect(clampLimit(9999)).toBe(MAX_PAGE_SIZE);
  });
});

describe("listRequests", () => {
  const rows = (n: number) =>
    Array.from({ length: n }, (_, i) => ({ id: `r${i}`, createdAt: new Date() }));

  it("requests one extra row to detect a next page and trims it", async () => {
    // limit 2 → take 3; return 3 rows → hasMore true, nextCursor = last kept id
    prismaMock.request.findMany.mockResolvedValue(rows(3));
    const page = await listRequests("e1", { limit: 2 });

    expect(prismaMock.request.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 3, where: { endpointId: "e1" } })
    );
    expect(page.items).toHaveLength(2);
    expect(page.nextCursor).toBe("r1");
  });

  it("returns null cursor when there is no next page", async () => {
    prismaMock.request.findMany.mockResolvedValue(rows(2));
    const page = await listRequests("e1", { limit: 5 });
    expect(page.items).toHaveLength(2);
    expect(page.nextCursor).toBeNull();
  });

  it("applies cursor with skip:1 for stable pagination", async () => {
    prismaMock.request.findMany.mockResolvedValue([]);
    await listRequests("e1", { limit: 10, cursor: "abc" });
    expect(prismaMock.request.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ cursor: { id: "abc" }, skip: 1 })
    );
  });

  it("normalizes method/status/since filters into the where clause", async () => {
    prismaMock.request.findMany.mockResolvedValue([]);
    const since = new Date("2026-01-01T00:00:00Z");
    await listRequests("e1", { method: "post", status: 500, since });
    const arg = prismaMock.request.findMany.mock.calls[0][0];
    expect(arg.where).toMatchObject({
      endpointId: "e1",
      method: "POST",
      statusCode: 500,
      createdAt: { gte: since },
    });
  });

  it("merges the search OR clause into the where (keyset still applies)", async () => {
    prismaMock.request.findMany.mockResolvedValue([]);
    await listRequests("e1", { search: "charge.succeeded" });
    const arg = prismaMock.request.findMany.mock.calls[0][0];
    expect(arg.where.endpointId).toBe("e1");
    expect(arg.where.OR).toEqual([
      { rawBody: { contains: "charge.succeeded", mode: "insensitive" } },
      { method: { contains: "charge.succeeded", mode: "insensitive" } },
      { contentType: { contains: "charge.succeeded", mode: "insensitive" } },
    ]);
  });
});

describe("liveRequestsAfter", () => {
  it("tails forward (oldest-first) with a bounded take and no cursor at the tail start", async () => {
    prismaMock.request.findMany.mockResolvedValue([]);
    await liveRequestsAfter("e1", null, 50);
    const arg = prismaMock.request.findMany.mock.calls[0][0];
    expect(arg.where).toEqual({ endpointId: "e1" });
    expect(arg.orderBy).toEqual([{ createdAt: "asc" }, { id: "asc" }]);
    expect(arg.take).toBe(50);
    expect(arg.cursor).toBeUndefined();
    // selects the richer inspector fields (incl. statusCode/duration/pinned)
    expect(arg.select).toMatchObject({ statusCode: true, duration: true, pinned: true });
  });

  it("resumes after a cursor with skip:1 and clamps the take to <=200", async () => {
    prismaMock.request.findMany.mockResolvedValue([]);
    await liveRequestsAfter("e1", "cur", 9999);
    const arg = prismaMock.request.findMany.mock.calls[0][0];
    expect(arg.cursor).toEqual({ id: "cur" });
    expect(arg.skip).toBe(1);
    expect(arg.take).toBe(200);
  });
});

describe("buildRequestSearchFilter", () => {
  it("returns undefined for empty / whitespace-only queries", () => {
    expect(buildRequestSearchFilter()).toBeUndefined();
    expect(buildRequestSearchFilter("")).toBeUndefined();
    expect(buildRequestSearchFilter("   ")).toBeUndefined();
  });

  it("searches rawBody/method/contentType case-insensitively", () => {
    const f = buildRequestSearchFilter("  Stripe  ");
    // trims the query
    expect(f).toEqual({
      OR: [
        { rawBody: { contains: "Stripe", mode: "insensitive" } },
        { method: { contains: "Stripe", mode: "insensitive" } },
        { contentType: { contains: "Stripe", mode: "insensitive" } },
      ],
    });
  });

  it("adds an exact statusCode match only for pure-integer queries", () => {
    const numeric = buildRequestSearchFilter("404");
    expect(numeric?.OR).toContainEqual({ statusCode: 404 });

    const mixed = buildRequestSearchFilter("40x");
    expect(mixed?.OR).not.toContainEqual(expect.objectContaining({ statusCode: expect.anything() }));
  });
});

describe("captureRequest", () => {
  it("writes the request and increments the endpoint counter in one transaction", async () => {
    prismaMock.request.create.mockReturnValue("create-op");
    prismaMock.endpoint.update.mockReturnValue("update-op");
    prismaMock.$transaction.mockResolvedValue([{ id: "new" }, {}]);

    await captureRequest({
      endpointId: "e1",
      method: "POST",
      headers: { "content-type": "application/json" },
      body: { ok: true },
      rawBody: "{}",
      contentType: "application/json",
      query: {},
      response: { message: "ok" },
      statusCode: 200,
      duration: 12,
      expiresAt: new Date("2026-07-01T00:00:00Z"),
    });

    expect(prismaMock.endpoint.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "e1" },
        data: expect.objectContaining({ requestCount: { increment: 1 } }),
      })
    );
    // both ops handed to a single transaction
    expect(prismaMock.$transaction).toHaveBeenCalledWith(["create-op", "update-op"]);
  });
});

describe("setPinned", () => {
  it("pinning nulls out expiresAt so the row is exempt from the sweep + TTL", async () => {
    prismaMock.request.update.mockResolvedValue({ id: "r1", pinned: true });
    await setPinned("r1", true);
    expect(prismaMock.request.update).toHaveBeenCalledWith({
      where: { id: "r1" },
      data: { pinned: true, expiresAt: null },
    });
    // no read needed when pinning
    expect(prismaMock.request.findUnique).not.toHaveBeenCalled();
  });

  it("unpinning recomputes expiresAt from the endpoint's retention window", async () => {
    const createdAt = new Date("2026-06-01T00:00:00Z");
    prismaMock.request.findUnique.mockResolvedValue({
      createdAt,
      endpoint: { retentionDays: 7 },
    });
    prismaMock.request.update.mockResolvedValue({ id: "r1", pinned: false });

    await setPinned("r1", false);

    const expected = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
    expect(prismaMock.request.update).toHaveBeenCalledWith({
      where: { id: "r1" },
      data: { pinned: false, expiresAt: expected },
    });
  });
});

describe("deleteExpiredRequests", () => {
  it("dry run counts would-be deletions without deleting", async () => {
    prismaMock.request.count.mockResolvedValue(42);
    const res = await deleteExpiredRequests({ dryRun: true });

    expect(res).toEqual({ deleted: 0, wouldDelete: 42, passes: 0, dryRun: true });
    expect(prismaMock.request.deleteMany).not.toHaveBeenCalled();
    // only unpinned + expired rows are counted
    const where = prismaMock.request.count.mock.calls[0][0].where;
    expect(where.pinned).toBe(false);
    expect(where.expiresAt).toHaveProperty("lte");
  });

  it("deletes a single partial batch and stops", async () => {
    prismaMock.request.findMany.mockResolvedValueOnce([{ id: "a" }, { id: "b" }]);
    prismaMock.request.deleteMany.mockResolvedValue({ count: 2 });

    const res = await deleteExpiredRequests({ batchSize: 1000 });

    expect(res).toMatchObject({ deleted: 2, passes: 1, dryRun: false });
    expect(prismaMock.request.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ["a", "b"] } },
    });
    // partial page (2 < 1000) → no second findMany
    expect(prismaMock.request.findMany).toHaveBeenCalledTimes(1);
  });

  it("loops full batches until a short page, accumulating the count", async () => {
    prismaMock.request.findMany
      .mockResolvedValueOnce([{ id: "a" }, { id: "b" }]) // full page
      .mockResolvedValueOnce([{ id: "c" }]); // short page → stop
    prismaMock.request.deleteMany
      .mockResolvedValueOnce({ count: 2 })
      .mockResolvedValueOnce({ count: 1 });

    const res = await deleteExpiredRequests({ batchSize: 2 });

    expect(res).toMatchObject({ deleted: 3, passes: 2 });
    expect(prismaMock.request.deleteMany).toHaveBeenCalledTimes(2);
  });

  it("stops cleanly when nothing is expired", async () => {
    prismaMock.request.findMany.mockResolvedValueOnce([]);
    const res = await deleteExpiredRequests();
    expect(res).toMatchObject({ deleted: 0, passes: 0 });
    expect(prismaMock.request.deleteMany).not.toHaveBeenCalled();
  });
});
