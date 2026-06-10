import { describe, it, expect, beforeAll } from "vitest";
import {
  signAnonToken,
  verifyAnonToken,
  sha256,
  randomToken,
  ANON_PREFIX,
  SESSION_MAX_AGE,
} from "@/lib/auth";

beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret-please-ignore";
});

const NOW = 1_750_000_000_000; // fixed instant (ms)

describe("signAnonToken / verifyAnonToken", () => {
  it("round-trips a userId for a valid, unexpired token", () => {
    const token = signAnonToken("01HXULID", NOW);
    expect(token.startsWith(ANON_PREFIX)).toBe(true);
    expect(verifyAnonToken(token, NOW)).toEqual({ userId: "01HXULID" });
  });

  it("rejects an expired token", () => {
    const token = signAnonToken("u1", NOW, 60); // 60s TTL
    expect(verifyAnonToken(token, NOW + 61_000)).toBeNull();
    // still valid just before expiry
    expect(verifyAnonToken(token, NOW + 59_000)).toEqual({ userId: "u1" });
  });

  it("rejects a tampered signature", () => {
    const token = signAnonToken("u1", NOW);
    const tampered = token.slice(0, -2) + (token.endsWith("a") ? "bb" : "aa");
    expect(verifyAnonToken(tampered, NOW)).toBeNull();
  });

  it("rejects a tampered payload (userId swapped) — signature no longer matches", () => {
    const a = signAnonToken("victim", NOW);
    const b = signAnonToken("attacker", NOW);
    // Splice attacker's payload onto victim's structure: the HMAC won't validate.
    const aParts = a.slice(ANON_PREFIX.length).split(".");
    const bParts = b.slice(ANON_PREFIX.length).split(".");
    const forged = `${ANON_PREFIX}${bParts[0]}.${aParts[1]}.${aParts[2]}`;
    expect(verifyAnonToken(forged, NOW)).toBeNull();
  });

  it("rejects tokens without the anon prefix or malformed structure", () => {
    expect(verifyAnonToken("garbage", NOW)).toBeNull();
    expect(verifyAnonToken("s:something", NOW)).toBeNull();
    expect(verifyAnonToken(`${ANON_PREFIX}only.two`, NOW)).toBeNull();
  });

  it("uses the configured default TTL", () => {
    const token = signAnonToken("u1", NOW);
    expect(verifyAnonToken(token, NOW + SESSION_MAX_AGE * 1000 - 1000)).toEqual({
      userId: "u1",
    });
    expect(verifyAnonToken(token, NOW + SESSION_MAX_AGE * 1000 + 1000)).toBeNull();
  });
});

describe("sha256 / randomToken", () => {
  it("sha256 is deterministic and hex", () => {
    expect(sha256("abc")).toBe(sha256("abc"));
    expect(sha256("abc")).toMatch(/^[0-9a-f]{64}$/);
    expect(sha256("abc")).not.toBe(sha256("abd"));
  });

  it("randomToken returns distinct URL-safe tokens", () => {
    const a = randomToken();
    const b = randomToken();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
