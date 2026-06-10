/**
 * Server-Sent Events framing helpers. Pure string builders so the relay route
 * stays a thin stream controller and the wire format is unit-tested.
 *
 * SSE wire format: each field is `name: value\n`, an event is terminated by a
 * blank line, and a line starting with `:` is a comment (clients ignore it —
 * we use comments as keep-alive heartbeats).
 */

/**
 * One named SSE event. `data` is JSON-encoded; a multi-line JSON string is
 * split into one `data:` line per line, as the spec requires (the client
 * rejoins them with `\n`).
 */
export function sseEvent(event: string, data: unknown): string {
  const payload = JSON.stringify(data) ?? "null";
  const dataLines = payload
    .split("\n")
    .map((line) => `data: ${line}`)
    .join("\n");
  return `event: ${event}\n${dataLines}\n\n`;
}

/** A comment line (ignored by clients) — used as a keep-alive heartbeat. */
export function sseComment(text = ""): string {
  return `: ${text}\n\n`;
}
