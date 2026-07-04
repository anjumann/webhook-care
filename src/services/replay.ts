/**
 * Replay a captured request to its endpoint's **forwarding target(s)** — resend
 * the stored request out to the URLs the owner configured for forwarding.
 *
 * Trust model: these are the same owner-configured forwarding URLs the ingest
 * hot path already POSTs to (fire-and-forget), so replay introduces no new
 * outbound surface — it's the owner re-triggering their own forward. Unlike
 * ingest, replay is **awaited** so we can report per-target results, and it only
 * returns status codes (never the target's response body) so it can't be used to
 * exfiltrate an internal response. Redirects are not followed.
 *
 * Fidelity note: the stored request has **redacted** headers (secrets scrubbed
 * at ingest) but a **verbatim** `rawBody`, so downstream signature checks that
 * read a signature header won't pass — same known limit as the live relay.
 */
import { prisma } from "@/lib/prisma";

const REPLAY_TIMEOUT_MS = 10_000;

// Transport/host-specific headers that must not be replayed (fetch sets its own,
// or they describe the original hop). Mirrors the ingest forward path.
const SKIP_HEADERS = new Set([
  "host",
  "content-length",
  "connection",
  "content-encoding",
  "transfer-encoding",
  "accept-encoding",
]);

/** Drop transport/host headers from a stored header map. Pure + unit-tested. */
export function buildReplayHeaders(
  stored: Record<string, string> | null | undefined
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(stored ?? {})) {
    if (SKIP_HEADERS.has(key.toLowerCase())) continue;
    out[key] = value;
  }
  return out;
}

/** Serialize the stored body back to a request body string. Pure + unit-tested. */
export function buildReplayBody(
  method: string,
  rawBody: string | null | undefined,
  body: unknown
): string | undefined {
  if (method === "GET" || method === "HEAD") return undefined;
  if (rawBody) return rawBody;
  if (body === null || body === undefined) return undefined;
  try {
    return JSON.stringify(body);
  } catch {
    return undefined;
  }
}

export interface ReplayTargetResult {
  url: string;
  ok: boolean;
  status?: number;
  error?: string;
}

export type ReplayOutcome =
  | { ok: true; results: ReplayTargetResult[] }
  | { ok: false; status: number; error: string };

/**
 * Resend a captured request to every forwarding target on its endpoint.
 * Ownership must already be enforced by the caller (route guard). Returns a
 * per-target result array; never throws.
 */
export async function replayToForwarding(
  requestId: string
): Promise<ReplayOutcome> {
  const req = await prisma.request.findUnique({
    where: { id: requestId },
    select: {
      method: true,
      headers: true,
      rawBody: true,
      body: true,
      endpoint: { select: { forwardingUrls: { select: { url: true } } } },
    },
  });
  if (!req) return { ok: false, status: 404, error: "Request not found" };

  const targets = req.endpoint?.forwardingUrls ?? [];
  if (targets.length === 0) {
    return {
      ok: false,
      status: 400,
      error: "This endpoint has no forwarding targets to replay to.",
    };
  }

  const method = (req.method || "POST").toUpperCase();
  const headers = buildReplayHeaders(req.headers as Record<string, string>);
  const body = buildReplayBody(method, req.rawBody, req.body);

  const results = await Promise.all(
    targets.map((t) => sendOne(t.url, method, headers, body))
  );
  return { ok: true, results };
}

async function sendOne(
  url: string,
  method: string,
  headers: Record<string, string>,
  body: string | undefined
): Promise<ReplayTargetResult> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { url, ok: false, error: "Invalid URL" };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { url, ok: false, error: "Unsupported protocol" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REPLAY_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method,
      headers,
      body,
      signal: controller.signal,
      redirect: "manual", // don't chase a redirect to an internal location
    });
    // Free the socket without buffering the (untrusted) response body.
    try {
      await res.body?.cancel();
    } catch {
      /* ignore */
    }
    return { url, ok: res.ok, status: res.status };
  } catch (e) {
    return {
      url,
      ok: false,
      error: e instanceof Error ? e.message : "Request failed",
    };
  } finally {
    clearTimeout(timer);
  }
}
