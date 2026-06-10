import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the underlying service layer; the MCP service is a thin shaping/auth
// layer over it, so we assert what it does to inputs/outputs — not Prisma.
const endpointsMock = vi.hoisted(() => ({
  listEndpoints: vi.fn(),
  findEndpointIdForOwner: vi.fn(),
  isEndpointOwnedBy: vi.fn(),
}));
const requestsMock = vi.hoisted(() => ({
  listRequests: vi.fn(),
  getRequest: vi.fn(),
}));

vi.mock("@/services/endpoints", () => endpointsMock);
vi.mock("@/services/requests", () => requestsMock);

import {
  truncateBody,
  redactRequest,
  shapeListItem,
  isToolError,
  listEndpointsForAgent,
  getRequestsForAgent,
  getRequestForAgent,
  MAX_LIST_BODY_CHARS,
} from "@/services/mcp";

beforeEach(() => {
  vi.clearAllMocks();
});

const baseReq = {
  id: "r1",
  endpointId: "e1",
  method: "POST",
  statusCode: 200,
  contentType: "application/json",
  duration: 12,
  pinned: false,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  query: { a: "1" },
  headers: { authorization: "Bearer secret", "content-type": "application/json" },
  body: { hello: "world", password: "hunter2" },
  response: { ok: true },
} as never;

describe("isToolError", () => {
  it("detects the { error } shape and rejects normal results", () => {
    expect(isToolError({ error: "nope" })).toBe(true);
    expect(isToolError({ items: [] })).toBe(false);
    expect(isToolError(null)).toBe(false);
    expect(isToolError({ error: 123 })).toBe(false);
  });
});

describe("truncateBody", () => {
  it("leaves null and small bodies untouched", () => {
    expect(truncateBody(null)).toEqual({ body: null, truncated: false });
    expect(truncateBody({ a: 1 })).toEqual({ body: { a: 1 }, truncated: false });
  });
  it("truncates an oversized body and flags it", () => {
    const big = "x".repeat(MAX_LIST_BODY_CHARS * 4);
    const out = truncateBody(big);
    expect(out.truncated).toBe(true);
    expect(typeof out.body).toBe("string");
    expect((out.body as string).length).toBeLessThan(big.length);
    expect(out.body as string).toContain("get_request");
  });
});

describe("redactRequest", () => {
  it("strips secret headers and secret body keys, keeps the rest", () => {
    const r = redactRequest(baseReq);
    expect((r.headers as Record<string, unknown>).authorization).toBe("[REDACTED]");
    expect((r.headers as Record<string, unknown>)["content-type"]).toBe("application/json");
    expect((r.body as Record<string, unknown>).password).toBe("[REDACTED]");
    expect((r.body as Record<string, unknown>).hello).toBe("world");
    expect(r.method).toBe("POST");
    expect(r.id).toBe("r1");
  });
});

describe("shapeListItem", () => {
  it("redacts and only adds bodyTruncated when the body is large", () => {
    const small = shapeListItem(baseReq);
    expect("bodyTruncated" in small).toBe(false);
    expect((small.headers as Record<string, unknown>).authorization).toBe("[REDACTED]");

    const bigReq = { ...(baseReq as object), body: "y".repeat(MAX_LIST_BODY_CHARS + 10) } as never;
    const big = shapeListItem(bigReq);
    expect((big as { bodyTruncated?: boolean }).bodyTruncated).toBe(true);
  });
});

describe("listEndpointsForAgent", () => {
  it("shapes only the public fields", async () => {
    endpointsMock.listEndpoints.mockResolvedValue([
      { id: "e1", name: "n", description: "d", status: "active", requestCount: 3, retentionDays: 30, lastActivity: null, createdAt: new Date(), userId: "leak", secret: "x" },
    ]);
    const out = await listEndpointsForAgent("u1");
    expect(endpointsMock.listEndpoints).toHaveBeenCalledWith("u1");
    expect(out[0]).not.toHaveProperty("userId");
    expect(out[0]).not.toHaveProperty("secret");
    expect(out[0].id).toBe("e1");
  });
});

describe("getRequestsForAgent", () => {
  it("returns a tool error when the endpoint isn't owned/found", async () => {
    endpointsMock.findEndpointIdForOwner.mockResolvedValue(null);
    const res = await getRequestsForAgent("u1", { endpoint: "other" });
    expect(isToolError(res)).toBe(true);
    expect(requestsMock.listRequests).not.toHaveBeenCalled();
  });

  it("resolves the owner-scoped endpoint id, paginates, and shapes items", async () => {
    endpointsMock.findEndpointIdForOwner.mockResolvedValue("e1");
    requestsMock.listRequests.mockResolvedValue({ items: [baseReq], nextCursor: "r1" });
    const res = await getRequestsForAgent("u1", { endpoint: "myname", limit: 10, since: "2026-01-01T00:00:00Z" });

    expect(endpointsMock.findEndpointIdForOwner).toHaveBeenCalledWith("u1", "myname");
    expect(requestsMock.listRequests).toHaveBeenCalledWith(
      "e1",
      expect.objectContaining({ limit: 10, since: new Date("2026-01-01T00:00:00Z") })
    );
    expect(isToolError(res)).toBe(false);
    if (!isToolError(res)) {
      expect(res.endpointId).toBe("e1");
      expect(res.nextCursor).toBe("r1");
      expect((res.items[0].headers as Record<string, unknown>).authorization).toBe("[REDACTED]");
    }
  });
});

describe("getRequestForAgent", () => {
  it("404s (same message) for a missing request", async () => {
    requestsMock.getRequest.mockResolvedValue(null);
    const res = await getRequestForAgent("u1", "missing");
    expect(res).toEqual({ error: "Request not found" });
    expect(endpointsMock.isEndpointOwnedBy).not.toHaveBeenCalled();
  });

  it("404s for a request the caller does not own (no existence leak)", async () => {
    requestsMock.getRequest.mockResolvedValue(baseReq);
    endpointsMock.isEndpointOwnedBy.mockResolvedValue(false);
    const res = await getRequestForAgent("attacker", "r1");
    expect(res).toEqual({ error: "Request not found" });
  });

  it("returns the redacted request when owned", async () => {
    requestsMock.getRequest.mockResolvedValue(baseReq);
    endpointsMock.isEndpointOwnedBy.mockResolvedValue(true);
    const res = await getRequestForAgent("u1", "r1");
    expect(isToolError(res)).toBe(false);
    if (!isToolError(res)) {
      expect((res.headers as Record<string, unknown>).authorization).toBe("[REDACTED]");
      expect(res.id).toBe("r1");
    }
  });
});
