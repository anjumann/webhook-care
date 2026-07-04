"use client";

import { useEffect, useRef, useState } from "react";
import type { RequestRecord } from "@/endpoints/types";
import { track } from "@/lib/analytics";

export type StreamStatus = "closed" | "connecting" | "open";

// Give up after this many consecutive connection errors with no successful
// open in between (e.g. a hard 401/404) so we never hot-loop a dead endpoint.
const MAX_CONSECUTIVE_ERRORS = 5;
const RETRY_MS = 2_000;

/**
 * Subscribe to an endpoint's live capture stream (`/api/endpoints/[id]/stream`)
 * via `EventSource`. The session cookie rides along automatically, so no auth
 * wiring is needed here. New rows are delivered to `onRequest` (newest last, as
 * the server tails forward); the caller decides how to merge them.
 *
 * Resilience mirrors the server contract: we keep the last delivered id as a
 * cursor and, on the server's graceful `reconnect` (fired just before it closes
 * at maxDuration) or on a transient network error, reconnect with `?after=` so
 * no capture is dropped across the handoff.
 */
export function useRequestStream(
  endpointId: string | undefined,
  opts: { enabled: boolean; onRequest: (row: RequestRecord) => void }
): { status: StreamStatus } {
  const { enabled, onRequest } = opts;
  const [status, setStatus] = useState<StreamStatus>("closed");

  // Keep the latest callback without re-subscribing on every render.
  const onRequestRef = useRef(onRequest);
  onRequestRef.current = onRequest;

  useEffect(() => {
    if (!enabled || !endpointId) {
      setStatus("closed");
      return;
    }

    let es: EventSource | null = null;
    let disposed = false;
    let cursor: string | null = null;
    let errors = 0;
    let trackedOpen = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const parse = (e: Event): unknown => {
      try {
        return JSON.parse((e as MessageEvent).data);
      } catch {
        return null;
      }
    };

    const connect = () => {
      if (disposed) return;
      setStatus("connecting");
      const qs = cursor ? `?after=${encodeURIComponent(cursor)}` : "";
      es = new EventSource(`/api/endpoints/${endpointId}/stream${qs}`);

      es.addEventListener("ready", (e) => {
        errors = 0;
        setStatus("open");
        if (!trackedOpen) {
          trackedOpen = true;
          track("live_stream_connected");
        }
        const data = parse(e) as { cursor?: string | null } | null;
        if (data?.cursor) cursor = data.cursor;
      });

      es.addEventListener("request", (e) => {
        const row = parse(e) as RequestRecord | null;
        if (!row) return;
        cursor = row.id;
        onRequestRef.current(row);
      });

      // Server is about to close at its TTL — hand off immediately at the cursor.
      es.addEventListener("reconnect", (e) => {
        const data = parse(e) as { cursor?: string | null } | null;
        if (data?.cursor) cursor = data.cursor;
        es?.close();
        connect();
      });

      es.onerror = () => {
        es?.close(); // closed sources emit no further events → no double reconnect
        if (disposed) return;
        errors += 1;
        if (errors >= MAX_CONSECUTIVE_ERRORS) {
          setStatus("closed");
          return;
        }
        setStatus("connecting");
        clearTimeout(retryTimer);
        retryTimer = setTimeout(connect, RETRY_MS);
      };
    };

    connect();

    return () => {
      disposed = true;
      clearTimeout(retryTimer);
      es?.close();
      setStatus("closed");
    };
  }, [enabled, endpointId]);

  return { status };
}
