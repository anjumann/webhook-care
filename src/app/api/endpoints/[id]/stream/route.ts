/**
 * GET /api/endpoints/[id]/stream — live Server-Sent Events stream of an
 * endpoint's captures for the **dashboard** inspector ("watch it land live").
 *
 * This is the owner-guarded sibling of the CLI relay (`/api/v1/relay`): same
 * SSE-from-DB pattern (cursor-tailed off the `([endpointId, createdAt])` keyset,
 * self-closes before maxDuration with a `reconnect` hint so nothing is lost),
 * but authed by the **session cookie** (`requireOwnerOfEndpoint`) instead of a
 * bearer PAT — `EventSource` sends the cookie automatically. Rows are the stored
 * **redacted** copy (secrets scrubbed at ingest), and it selects the richer
 * inspector fields (`liveRequestsAfter`) so a streamed row renders a full table
 * row without a follow-up fetch.
 */
import { NextRequest } from "next/server";
import { requireOwnerOfEndpoint } from "@/services/auth";
import { findEndpointIdForOwner } from "@/services/endpoints";
import { latestRequestId, liveRequestsAfter } from "@/services/requests";
import { sseEvent, sseComment } from "@/lib/sse";
import { fail } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const POLL_MS = 1_500;
const HEARTBEAT_MS = 15_000;
// Close cleanly (with a `reconnect` hint) before the platform kills the function.
const STREAM_TTL_MS = 280_000;
const BATCH = 50;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const auth = await requireOwnerOfEndpoint(id);
  if (!auth.ok) return fail(auth.message, auth.status);

  // Resolve to the real endpoint id (owner-scoped) so the [id] segment can be an
  // id or a name, and so the keyset query never gets a non-ObjectId string.
  const endpointId = await findEndpointIdForOwner(auth.userId, id);
  if (!endpointId) return fail("Endpoint not found", 404);

  // Resume from the client's cursor, else start at the current tail so a freshly
  // opened inspector only streams captures that arrive *after* it connects.
  const after = new URL(request.url).searchParams.get("after");
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

      request.signal.addEventListener("abort", close);

      // Tell the client where we're tailing from so it can persist the cursor.
      send(sseEvent("ready", { cursor }));

      let lastBeat = Date.now();
      while (!closed) {
        try {
          const rows = await liveRequestsAfter(endpointId, cursor, BATCH);
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
      "X-Accel-Buffering": "no",
    },
  });
}
