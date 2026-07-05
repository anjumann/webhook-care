// Build a copy-paste-ready `curl` command that reproduces a captured request.
// Pure + unit-tested. Stored headers are already secret-redacted at write time
// (`lib/redact`), so it's safe to render them; we still drop hop-by-hop / host
// headers that would be wrong or meaningless when replayed from a shell.

export interface CurlInput {
  /** The endpoint's webhook URL (query is appended from `query` if absent). */
  url: string;
  method?: string;
  headers?: Record<string, string>;
  /** Parsed body (object) or raw string; omitted when null/empty. */
  body?: unknown;
  /** Captured query params, appended to `url` when it has none. */
  query?: Record<string, unknown> | null;
}

// Headers that don't belong in a hand-run curl (the shell/curl set these, or
// they describe the original transport, not the request to reproduce).
const DROP_HEADERS = new Set([
  "host",
  "content-length",
  "connection",
  "accept-encoding",
  "transfer-encoding",
]);

/** POSIX single-quote a value: wrap in '…' and escape embedded quotes as '\''. */
function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function serializeBody(body: unknown): string | null {
  if (body === null || body === undefined) return null;
  if (typeof body === "string") return body.length ? body : null;
  try {
    return JSON.stringify(body);
  } catch {
    return null;
  }
}

function appendQuery(url: string, query?: Record<string, unknown> | null): string {
  if (!query || url.includes("?")) return url;
  const qs = Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return qs ? `${url}?${qs}` : url;
}

/** Compose a multi-line curl command (line-continued for readability). */
export function buildCurl(input: CurlInput): string {
  const method = (input.method || "GET").toUpperCase();
  const url = appendQuery(input.url, input.query);

  const first = ["curl"];
  if (method !== "GET") first.push(`-X ${method}`);
  first.push(shellQuote(url));

  const lines: string[] = [first.join(" ")];

  for (const [key, value] of Object.entries(input.headers ?? {})) {
    if (DROP_HEADERS.has(key.toLowerCase())) continue;
    lines.push(`  -H ${shellQuote(`${key}: ${value}`)}`);
  }

  const body = serializeBody(input.body);
  if (body) lines.push(`  --data-raw ${shellQuote(body)}`);

  return lines.join(" \\\n");
}
