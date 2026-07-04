// Server-side analytics wrapper over posthog-node, for the handful of events that
// only exist on the server (`mcp_connected`, `rest_api_called`).
//
// Rules (spec §4):
//  - **Never on the request's critical path.** Callers wrap `captureServer` in
//    Next's `after()` so it runs *after* the response is flushed, and it must
//    never touch the webhook ingest hot path.
//  - **No-op without a key** so CI/builds/dev without PostHog stay clean.
//  - Short-lived serverless invocations → an ephemeral client with
//    `flushAt: 1, flushInterval: 0` + `await shutdown()` per posthog-node's
//    serverless guidance (https://posthog.com/docs/libraries/next-js). Because
//    Fluid Compute reuses instances, a per-event client avoids sharing/closing a
//    long-lived singleton across requests.
import { PostHog } from "posthog-node";
import { sanitizeEventProps, type AnalyticsEvent, type AnalyticsProps } from "./analytics-core";

// Read env lazily (inside functions) so tests can toggle the key per-case and so
// the module has no import-time side effects.
function apiKey(): string | undefined {
  return process.env.NEXT_PUBLIC_POSTHOG_KEY;
}
function apiHost(): string {
  return process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
}

/** Whether server analytics will actually send (a project key is configured). */
export function analyticsEnabled(): boolean {
  return Boolean(apiKey());
}

/**
 * Deterministic, hash-based sampler for volume control on high-frequency server
 * events. **Stable per key**: the same key always yields the same decision at a
 * given rate (no per-call `Math.random` jitter), so tests are deterministic.
 * `rate <= 0` → never, `rate >= 1` → always. Pass a per-invocation key (e.g.
 * including a timestamp) for per-request sampling, or a stable key (e.g. a user
 * id) to sample a consistent cohort. Pure + unit-tested.
 */
export function shouldSample(key: string, rate: number): boolean {
  if (rate >= 1) return true;
  if (rate <= 0) return false;
  // FNV-1a 32-bit hash → a uniform value in [0, 1).
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) / 0x1_0000_0000 < rate;
}

export interface ServerCapture {
  /** The ULID (User.userId) — shared identity with client-side events. */
  distinctId: string;
  event: AnalyticsEvent;
  properties?: AnalyticsProps;
}

/**
 * Send a single server-side event and flush before returning. Never throws
 * (analytics must not break a route). No-op when no key is set or the caller has
 * no distinct id. Intended to be wrapped in `after()` so it runs off the
 * response path.
 */
export async function captureServer({
  distinctId,
  event,
  properties,
}: ServerCapture): Promise<void> {
  const key = apiKey();
  if (!key || !distinctId) return;
  const client = new PostHog(key, {
    host: apiHost(),
    flushAt: 1,
    flushInterval: 0,
  });
  try {
    client.capture({
      distinctId,
      event,
      properties: sanitizeEventProps(properties),
    });
    await client.shutdown();
  } catch {
    /* best-effort — never surface an analytics failure to the route */
  }
}
