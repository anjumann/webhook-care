import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Prisma singleton so unit tests never touch a real database.
// `vi.hoisted` makes the mock available to the hoisted `vi.mock` factory.
const prismaMock = vi.hoisted(() => ({
  request: {
    findMany: vi.fn(),
    create: vi.fn(),
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
  captureRequest,
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
