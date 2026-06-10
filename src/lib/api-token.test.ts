import { describe, it, expect, vi, beforeEach } from "vitest";

const prismaMock = vi.hoisted(() => ({
  apiToken: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import {
  generateToken,
  extractBearer,
  resolveToken,
  requireToken,
  TOKEN_PREFIX,
  SCOPE_REQUESTS_READ,
  SCOPE_ENDPOINTS_READ,
} from "@/lib/api-token";

beforeEach(() => vi.clearAllMocks());

describe("generateToken", () => {
  it("mints a wcat_-prefixed token with a matching hash + display prefix", () => {
    const { raw, hash, prefix } = generateToken();
    expect(raw.startsWith(TOKEN_PREFIX)).toBe(true);
    expect(prefix).toBe(raw.slice(0, 9));
    expect(hash).toMatch(/^[a-f0-9]{64}$/); // sha256 hex
    expect(hash).not.toContain(raw); // never the raw value
  });

  it("produces unique tokens", () => {
    expect(generateToken().raw).not.toBe(generateToken().raw);
  });
});

describe("extractBearer", () => {
  it("strips the Bearer prefix case-insensitively and trims", () => {
    expect(extractBearer("Bearer wcat_abc")).toBe("wcat_abc");
    expect(extractBearer("bearer   wcat_abc  ")).toBe("wcat_abc");
    expect(extractBearer("wcat_abc")).toBe("wcat_abc");
  });
  it("returns null for empty/missing headers", () => {
    expect(extractBearer(null)).toBeNull();
    expect(extractBearer("")).toBeNull();
    expect(extractBearer("Bearer    ")).toBeNull();
  });
});

describe("resolveToken", () => {
  it("rejects tokens without the wcat_ prefix without a DB hit", async () => {
    expect(await resolveToken("Bearer nope_123")).toBeNull();
    expect(prismaMock.apiToken.findUnique).not.toHaveBeenCalled();
  });

  it("returns null for unknown tokens", async () => {
    prismaMock.apiToken.findUnique.mockResolvedValue(null);
    expect(await resolveToken("Bearer wcat_unknown")).toBeNull();
  });

  it("returns null for an expired token", async () => {
    prismaMock.apiToken.findUnique.mockResolvedValue({
      id: "t1",
      userId: "u1",
      scopes: [SCOPE_REQUESTS_READ],
      expiresAt: new Date(Date.now() - 1000),
    });
    expect(await resolveToken("Bearer wcat_expired")).toBeNull();
  });

  it("resolves a valid token to its owner + scopes", async () => {
    prismaMock.apiToken.findUnique.mockResolvedValue({
      id: "t1",
      userId: "u1",
      scopes: [SCOPE_REQUESTS_READ, SCOPE_ENDPOINTS_READ],
      expiresAt: null,
    });
    expect(await resolveToken("Bearer wcat_ok")).toEqual({
      id: "t1",
      userId: "u1",
      scopes: [SCOPE_REQUESTS_READ, SCOPE_ENDPOINTS_READ],
    });
  });
});

describe("requireToken", () => {
  const req = (auth?: string) =>
    new Request("https://x/api/v1/endpoints", auth ? { headers: { authorization: auth } } : {});

  it("401s when no/invalid token", async () => {
    prismaMock.apiToken.findUnique.mockResolvedValue(null);
    const res = await requireToken(req("Bearer wcat_bad"), SCOPE_REQUESTS_READ);
    expect(res).toMatchObject({ ok: false, status: 401 });
  });

  it("403s when the scope is missing", async () => {
    prismaMock.apiToken.findUnique.mockResolvedValue({
      id: "t1",
      userId: "u1",
      scopes: [SCOPE_ENDPOINTS_READ],
      expiresAt: null,
    });
    const res = await requireToken(req("Bearer wcat_ok"), SCOPE_REQUESTS_READ);
    expect(res).toMatchObject({ ok: false, status: 403 });
  });

  it("passes and records lastUsedAt on a valid scoped token", async () => {
    prismaMock.apiToken.findUnique.mockResolvedValue({
      id: "t1",
      userId: "u1",
      scopes: [SCOPE_REQUESTS_READ],
      expiresAt: null,
    });
    prismaMock.apiToken.update.mockResolvedValue({});
    const res = await requireToken(req("Bearer wcat_ok"), SCOPE_REQUESTS_READ);
    expect(res).toMatchObject({ ok: true, userId: "u1", tokenId: "t1" });
    expect(prismaMock.apiToken.update).toHaveBeenCalledWith({
      where: { id: "t1" },
      data: { lastUsedAt: expect.any(Date) },
    });
  });
});
