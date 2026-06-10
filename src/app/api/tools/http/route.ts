/**
 * POST /api/tools/http — the standalone API client's proxy. Performs ONE
 * outbound HTTP request to a user-supplied URL and returns the full response
 * (status, timing, size, headers, body). Server-side because arbitrary cross-
 * origin calls can't be made from the browser (CORS) and we need the response
 * metadata.
 *
 * Guards (an arbitrary-URL fetch is an SSRF vector):
 *  - session-owned (`requireOwner`) — not an open proxy,
 *  - http(s) only, blocked hostnames + DNS-resolved private/loopback IPs,
 *  - request timeout + a capped response read.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import dns from "node:dns/promises";
import { requireOwner } from "@/services/auth";
import { ok, fail, failFromError, tooManyRequests } from "@/lib/http";
import { rateLimit } from "@/lib/ratelimit";
import {
  ALLOWED_METHODS,
  MAX_RESPONSE_BYTES,
  REQUEST_TIMEOUT_MS,
  parseTargetUrl,
  isBlockedHostname,
  isBlockedAddress,
  buildHeaderObject,
  methodHasBody,
} from "@/services/http-proxy";

export const runtime = "nodejs";
export const maxDuration = 30;

const bodySchema = z.object({
  userId: z.string().min(1),
  method: z.enum(ALLOWED_METHODS),
  url: z.string().min(1).max(4000),
  headers: z
    .array(z.object({ key: z.string(), value: z.string() }))
    .max(100)
    .optional(),
  body: z.string().max(1024 * 1024).optional(), // 1 MB request body cap
});

/** Read a response body up to `cap` bytes; flag truncation rather than OOM. */
async function readCapped(res: Response, cap: number) {
  if (!res.body) {
    const text = await res.text();
    return { text, bytes: Buffer.byteLength(text), truncated: false };
  }
  const reader = res.body.getReader();
  const chunks: Buffer[] = [];
  let bytes = 0;
  let truncated = false;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    chunks.push(Buffer.from(value));
    if (bytes > cap) {
      truncated = true;
      await reader.cancel().catch(() => {});
      break;
    }
  }
  const buf = Buffer.concat(chunks);
  const sliced = truncated ? buf.subarray(0, cap) : buf;
  return { text: sliced.toString("utf8"), bytes, truncated };
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Invalid request", 400);
    }
    const { userId, method, url, headers, body } = parsed.data;

    const auth = await requireOwner(userId);
    if (!auth.ok) return fail(auth.message, auth.status);

    const gate = await rateLimit("apiClient", userId);
    if (!gate.success) return tooManyRequests("Too many requests. Please slow down.");

    const target = parseTargetUrl(url);
    if (!target.ok) return fail(target.error, 400);

    if (isBlockedHostname(target.url.hostname)) {
      return fail("That host is not allowed (private or loopback address)", 400);
    }

    // Resolve DNS and reject if any address is private — a public hostname can
    // still point at an internal IP.
    try {
      const records = await dns.lookup(target.url.hostname, { all: true });
      if (records.length === 0 || records.some((r) => isBlockedAddress(r.address))) {
        return fail("That host resolves to a private or loopback address", 400);
      }
    } catch {
      return fail("Could not resolve that host", 400);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const started = Date.now();
    try {
      const upstream = await fetch(target.url, {
        method,
        headers: buildHeaderObject(headers),
        body: methodHasBody(method) ? body ?? undefined : undefined,
        signal: controller.signal,
        redirect: "follow",
      });
      const { text, bytes, truncated } = await readCapped(upstream, MAX_RESPONSE_BYTES);
      const durationMs = Date.now() - started;

      const responseHeaders: Record<string, string> = {};
      upstream.headers.forEach((v, k) => {
        responseHeaders[k] = v;
      });

      return ok({
        status: upstream.status,
        statusText: upstream.statusText,
        durationMs,
        sizeBytes: bytes,
        truncated,
        contentType: upstream.headers.get("content-type"),
        headers: responseHeaders,
        body: text,
      });
    } catch (err) {
      const aborted = err instanceof Error && err.name === "AbortError";
      return fail(
        aborted ? `Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s` : "Upstream request failed",
        aborted ? 504 : 502
      );
    } finally {
      clearTimeout(timer);
    }
  } catch (error) {
    return failFromError(error, "Error proxying API client request:");
  }
}
