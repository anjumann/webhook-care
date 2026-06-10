import { describe, it, expect } from "vitest";

// No UPSTASH_* env vars are set in the test environment, so the module loads in
// its disabled (no-op) mode — every check allows. This is the dev/free-tier
// path; the enforced path needs a live Redis and is covered by smoke tests.
import { rateLimit, rateLimitEnabled, clientIp } from "@/lib/ratelimit";

describe("rateLimit (Redis not configured → no-op)", () => {
  it("reports limiting as disabled", () => {
    expect(rateLimitEnabled).toBe(false);
  });

  it("allows every bucket and never throws", async () => {
    for (const name of ["ingest", "magicLink", "token", "export", "apiClient"] as const) {
      const r = await rateLimit(name, "any-key");
      expect(r.success).toBe(true);
      expect(r.limit).toBe(0); // 0 signals "disabled"
    }
  });
});

describe("clientIp", () => {
  const req = (headers: Record<string, string>) => new Request("https://x", { headers });

  it("takes the first hop of x-forwarded-for", () => {
    expect(clientIp(req({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7");
  });
  it("falls back to x-real-ip, then 'unknown'", () => {
    expect(clientIp(req({ "x-real-ip": "198.51.100.4" }))).toBe("198.51.100.4");
    expect(clientIp(req({}))).toBe("unknown");
  });
  it("ignores an empty x-forwarded-for and falls through", () => {
    expect(clientIp(req({ "x-forwarded-for": "", "x-real-ip": "1.2.3.4" }))).toBe("1.2.3.4");
  });
});
