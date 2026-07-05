/**
 * Rate limiting via Upstash Redis (`@upstash/ratelimit`).
 *
 * **Degrades to a no-op when Redis isn't configured** (no
 * `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`). That keeps local dev
 * and the free tier working without Redis: every `rateLimit(...)` call returns
 * `success: true`. When the env vars are present, sliding-window limits apply
 * per named bucket. A Redis error also **fails open** — we never block
 * legitimate traffic on an infra hiccup.
 *
 * Buckets (see docs/03 §rate limiting, docs/02 §6.4):
 *  - `ingest`    — public webhook write path, per IP
 *  - `magicLink` — sign-in link sends, per email AND per IP (enumeration/spam)
 *  - `token`     — Agent REST + MCP, per token id
 *  - `export`    — ZIP export (heavy), per user
 *  - `apiClient` — the API-client proxy, per user
 */
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export interface LimitResult {
  success: boolean;
  /** Max requests in the window (0 when limiting is disabled). */
  limit: number;
  remaining: number;
  /** Epoch ms when the window resets (0 when disabled). */
  reset: number;
}

/** The "allowed" result used when limiting is disabled or fails open. */
const ALLOW: LimitResult = { success: true, limit: 0, remaining: 0, reset: 0 };

type Window = Parameters<typeof Ratelimit.slidingWindow>[1];

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

/** True when Redis is configured and limits are actually enforced. */
export const rateLimitEnabled = redis !== null;

function make(tokens: number, window: Window, prefix: string): Ratelimit | null {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(tokens, window),
    analytics: true,
    prefix: `wcat:rl:${prefix}`,
  });
}

const limiters = {
  ingest: make(100, "1 m", "ingest"),
  magicLink: make(5, "1 h", "magic"),
  token: make(120, "1 m", "token"),
  export: make(10, "1 h", "export"),
  apiClient: make(60, "1 m", "apiclient"),
  replay: make(60, "1 m", "replay"),
};

export type LimiterName = keyof typeof limiters;

/**
 * Check a named bucket for `identifier`. Returns `ALLOW` when limiting is
 * disabled (no Redis) or on any Redis error (fail open). Never throws.
 */
export async function rateLimit(
  name: LimiterName,
  identifier: string
): Promise<LimitResult> {
  const limiter = limiters[name];
  if (!limiter) return ALLOW;
  try {
    const r = await limiter.limit(identifier);
    return { success: r.success, limit: r.limit, remaining: r.remaining, reset: r.reset };
  } catch (err) {
    console.error(`[ratelimit:${name}] check failed, allowing:`, err);
    return ALLOW;
  }
}

/**
 * Best-effort client IP from proxy headers (Vercel sets `x-forwarded-for`).
 * Falls back to a constant so a missing header doesn't bucket everyone into the
 * same key only when truly unknown.
 */
export function clientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
