#!/usr/bin/env node
/**
 * wcat — a tiny relay client that bridges the internet to your machine.
 *
 *   wcat listen --endpoint my-hook --forward localhost:3000
 *
 * It holds an OUTBOUND Server-Sent Events connection to the wcat relay
 * (`/api/v1/relay`), so it works from behind NAT/firewalls where the server
 * could never reach your laptop. Each capture is replayed to your local URL.
 *
 * Dependency-free: Node 18+ global `fetch`. Auth is a read-only PAT via
 * `--token` or the `WCAT_TOKEN` env var. The relay base URL defaults to
 * https://wcat.dev (override with `--api` or `WCAT_API`, e.g. for local dev:
 * `--api http://localhost:3001`).
 *
 * NOTE: the relay streams the stored (redacted) copy of each request, so secret
 * headers (signatures, auth) arrive as `[REDACTED]`. Method, path, query, and
 * body are intact — good for exercising handler logic; signature verification
 * against a relayed request won't pass (yet).
 */
import { pathToFileURL } from "node:url";

const DEFAULT_API = "https://wcat.dev";

/** Parse `listen --flag value --bool` argv into a command + options map. */
export function parseArgs(argv) {
  const [command, ...rest] = argv;
  const opts = {};
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = rest[i + 1];
    if (next === undefined || next.startsWith("--")) {
      opts[key] = true; // bare flag
    } else {
      opts[key] = next;
      i++;
    }
  }
  return { command, opts };
}

/**
 * Normalize a `--forward` target into an absolute base URL. Accepts
 * `localhost:3000`, `127.0.0.1:3000/webhooks`, or a full `http(s)://…` URL;
 * defaults a bare host:port to http.
 */
export function normalizeTarget(target) {
  if (!target || typeof target !== "string") {
    throw new Error("--forward <host:port> is required");
  }
  const withScheme = /^https?:\/\//i.test(target) ? target : `http://${target}`;
  // Throws on garbage, which surfaces as a clear startup error.
  return new URL(withScheme).toString().replace(/\/$/, "");
}

/**
 * Turn a relayed request row + forward base into the fetch args for replay.
 * Drops hop-by-hop headers the runtime sets itself; carries query through.
 */
export function buildReplay(row, base) {
  const url = new URL(base);
  if (row.query && typeof row.query === "object") {
    for (const [k, v] of Object.entries(row.query)) {
      url.searchParams.set(k, String(v));
    }
  }

  const headers = {};
  for (const [k, v] of Object.entries(row.headers ?? {})) {
    const lk = k.toLowerCase();
    if (lk === "host" || lk === "content-length" || lk === "connection") continue;
    headers[k] = String(v);
  }

  const method = (row.method ?? "POST").toUpperCase();
  let body;
  if (method !== "GET" && method !== "HEAD") {
    if (typeof row.rawBody === "string" && row.rawBody.length) {
      body = row.rawBody;
    } else if (row.body != null) {
      body = JSON.stringify(row.body);
      if (!headers["content-type"] && !headers["Content-Type"]) {
        headers["content-type"] = "application/json";
      }
    }
  }

  return { url: url.toString(), init: { method, headers, body } };
}

/**
 * Incremental SSE parser. Feed it decoded chunks; it returns the events that
 * completed in this chunk. Handles events split across chunk boundaries and
 * multi-line `data:` fields.
 */
export function createSseParser() {
  let buf = "";
  return function push(chunk) {
    buf += chunk;
    const events = [];
    let sep;
    while ((sep = buf.indexOf("\n\n")) !== -1) {
      const raw = buf.slice(0, sep);
      buf = buf.slice(sep + 2);
      let event = "message";
      const dataLines = [];
      for (const line of raw.split("\n")) {
        if (line.startsWith(":")) continue; // comment/heartbeat
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
      }
      if (dataLines.length) {
        events.push({ event, data: dataLines.join("\n") });
      }
    }
    return events;
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function log(...args) {
  console.log(`[wcat]`, ...args);
}

async function listen(opts) {
  const token = opts.token || process.env.WCAT_TOKEN;
  const endpoint = opts.endpoint;
  const api = (opts.api || process.env.WCAT_API || DEFAULT_API).replace(/\/$/, "");

  if (!token) fatal("Missing API token. Pass --token or set WCAT_TOKEN.");
  if (!endpoint) fatal("Missing --endpoint <id|name>.");
  const base = normalizeTarget(opts.forward);

  log(`forwarding ${api} → ${base} (endpoint: ${endpoint})`);

  let cursor = null;
  let backoff = 1000;

  // Reconnect loop. The relay closes ~every 280s with a `reconnect` hint; any
  // other disconnect is retried with exponential backoff, resuming at `cursor`.
  for (;;) {
    try {
      const url = new URL(`${api}/api/v1/relay`);
      url.searchParams.set("endpoint", endpoint);
      if (cursor) url.searchParams.set("after", cursor);

      const res = await fetch(url, {
        headers: { authorization: `Bearer ${token}`, accept: "text/event-stream" },
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        if (res.status === 401 || res.status === 403 || res.status === 404) {
          fatal(`relay rejected (${res.status}): ${text || res.statusText}`);
        }
        throw new Error(`relay ${res.status}: ${text || res.statusText}`);
      }
      backoff = 1000; // connected — reset backoff
      cursor = await pump(res.body, base, cursor);
      // Clean reconnect (TTL) — loop immediately.
    } catch (err) {
      log(`disconnected: ${err.message}. reconnecting in ${backoff}ms…`);
      await sleep(backoff);
      backoff = Math.min(backoff * 2, 30_000);
    }
  }
}

/** Read the SSE body, replay each `request`, return the latest cursor. */
async function pump(body, base, startCursor) {
  let cursor = startCursor;
  const parse = createSseParser();
  const decoder = new TextDecoder();
  const reader = body.getReader();

  for (;;) {
    const { value, done } = await reader.read();
    if (done) return cursor;
    for (const { event, data } of parse(decoder.decode(value, { stream: true }))) {
      let payload;
      try {
        payload = JSON.parse(data);
      } catch {
        continue;
      }
      if (event === "ready") {
        cursor = payload.cursor ?? cursor;
        log(`connected (cursor: ${cursor ?? "now"})`);
      } else if (event === "reconnect") {
        cursor = payload.cursor ?? cursor;
        return cursor;
      } else if (event === "error") {
        log(`relay error: ${payload.message}`);
      } else if (event === "request") {
        cursor = payload.id ?? cursor;
        await replay(payload, base);
      }
    }
  }
}

async function replay(row, base) {
  const { url, init } = buildReplay(row, base);
  const started = Date.now();
  try {
    const res = await fetch(url, init);
    log(`${init.method} ${url} → ${res.status} (${Date.now() - started}ms)`);
  } catch (err) {
    log(`${init.method} ${url} → FAILED: ${err.message}`);
  }
}

function fatal(msg) {
  console.error(`[wcat] ${msg}`);
  process.exit(1);
}

function usage() {
  console.log(
    `wcat — relay captured webhooks to your local machine\n\n` +
      `Usage:\n` +
      `  wcat listen --endpoint <id|name> --forward <host:port> [--token <pat>] [--api <url>]\n\n` +
      `Env: WCAT_TOKEN (PAT), WCAT_API (relay base URL, default ${DEFAULT_API})\n\n` +
      `Example:\n` +
      `  wcat listen --endpoint my-hook --forward localhost:3000\n`
  );
}

async function main() {
  const { command, opts } = parseArgs(process.argv.slice(2));
  if (command === "listen") return listen(opts);
  usage();
  process.exit(command ? 1 : 0);
}

// Only run when executed directly (not when imported by tests).
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main();
}
