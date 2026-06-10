/**
 * GET /api/v1/relay?endpoint=<id|name>[&after=<cursor>] — live Server-Sent
 * Events stream of an endpoint's captures, for the `wcat listen` CLI to replay
 * to a local server (the "bridge from the internet to :3000").
 *
 * Why SSE + cursor instead of a socket: Vercel functions have a max duration,
 * so a long-lived push connection can't run forever. The client keeps the last
 * delivered id and reconnects with `?after=<cursor>`; the server tails the
 * existing `([endpointId, createdAt])` keyset forward from there. The Mongo
 * request store *is* the buffer — nothing is lost across a reconnect, and no
 * unbounded query is ever issued.
 *
 * Auth: read-only PAT (same `requireToken` resolver as the rest of /api/v1), so
 * revoking a token kills the relay too. The stream only ever carries the
 * REDACTED stored copy — secret headers (signatures, auth) were scrubbed at
 * ingest, so signature verification against a relayed request won't pass. A
 * future at-ingest tee can push originals to listeners without persisting them.
 */
import { NextRequest } from "next/server";
import { requireToken, SCOPE_REQUESTS_READ } from "@/lib/api-token";
import { findEndpointIdForOwner } from "@/services/endpoints";
import { latestRequestId, requestsAfter } from "@/services/requests";
import { sseEvent, sseComment } from "@/lib/sse";
import { fail } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Stay within the platform's per-invocation ceiling; we close ourselves a touch
// earlier and let the client reconnect.
export const maxDuration = 300;

const POLL_MS = 1_500;
const HEARTBEAT_MS = 15_000;
// End the stream cleanly (with a `reconnect` hint) before the function is
// killed mid-frame at maxDuration.
const STREAM_TTL_MS = 280_000;
const BATCH = 50;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function GET(request: NextRequest) {
  const auth = await requireToken(request, SCOPE_REQUESTS_READ);
  if (!auth.ok) return fail(auth.message, auth.status);

  const url = new URL(request.url);
  const idOrName = url.searchParams.get("endpoint");
  if (!idOrName) return fail("Missing ?endpoint=<id|name>", 400);

  const endpointId = await findEndpointIdForOwner(auth.userId, idOrName);
  if (!endpointId) return fail("Endpoint not found", 404);

  // Resume from the client's cursor, else start at the current tail so a fresh
  // listener only receives captures that land *after* it connects.
  const after = url.searchParams.get("after");
  let cursor = after ?? (await latestRequestId(endpointId));

  const encoder = new TextEncoder();
  const startedAt = Date.now();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          closed = true;
        }
      };
      const close = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      // Stop promptly when the client hangs up.
      request.signal.addEventListener("abort", close);

      // Tell the client where we're tailing from so it can persist the cursor.
      send(sseEvent("ready", { endpoint: idOrName, cursor }));

      let lastBeat = Date.now();
      while (!closed) {
        try {
          const rows = await requestsAfter(endpointId, cursor, BATCH);
          for (const row of rows) {
            send(sseEvent("request", row));
            cursor = row.id;
          }
        } catch {
          send(sseEvent("error", { message: "poll failed" }));
        }

        if (Date.now() - startedAt > STREAM_TTL_MS) {
          send(sseEvent("reconnect", { cursor }));
          break;
        }
        if (Date.now() - lastBeat > HEARTBEAT_MS) {
          send(sseComment("hb"));
          lastBeat = Date.now();
        }
        await sleep(POLL_MS);
      }
      close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Disable proxy buffering so events flush immediately.
      "X-Accel-Buffering": "no",
    },
  });
}
