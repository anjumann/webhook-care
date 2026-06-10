/**
 * Pure helpers for the standalone API client's server-side proxy (`POST
 * /api/tools/http`). The proxy fetches an **arbitrary user-supplied URL**, so
 * the headline risk is SSRF — a caller pointing it at `localhost`, a private
 * subnet, or the cloud metadata endpoint (169.254.169.254). These helpers are
 * the guard: validate the URL, reject private/loopback/link-local hosts, and
 * shape the outbound headers. Pure + side-effect-free so they're unit-tested
 * without a network. (The route additionally resolves DNS and re-checks the
 * resolved IPs — a hostname can point at a private address.)
 */
import net from "node:net";

export const ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] as const;
export type HttpMethod = (typeof ALLOWED_METHODS)[number];

/** Cap the response we read back so a huge download can't exhaust memory. */
export const MAX_RESPONSE_BYTES = 2 * 1024 * 1024; // 2 MB
/** Abort an upstream request that hangs. */
export const REQUEST_TIMEOUT_MS = 15_000;
/** Cap the number of custom request headers forwarded. */
export const MAX_HEADERS = 50;

/** Hop-by-hop / connection headers the runtime must set itself, never the user. */
const STRIP_HEADERS = new Set([
  "host",
  "content-length",
  "connection",
  "keep-alive",
  "transfer-encoding",
  "te",
  "trailer",
  "upgrade",
]);

export type UrlParse =
  | { ok: true; url: URL }
  | { ok: false; error: string };

/** Validate + parse a target URL: must be an absolute http(s) URL. */
export function parseTargetUrl(raw: string): UrlParse {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return { ok: false, error: "URL is required" };
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { ok: false, error: "Enter a valid absolute URL (including http:// or https://)" };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, error: "Only http and https URLs are allowed" };
  }
  if (!url.hostname) return { ok: false, error: "URL is missing a host" };
  return { ok: true, url };
}

/**
 * Block obviously-internal hostnames before any DNS lookup: `localhost`, the
 * `.local`/`.internal` suffixes, and IP literals that fall in a private range.
 */
export function isBlockedHostname(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/\.$/, ""); // strip trailing dot
  if (h === "localhost" || h.endsWith(".localhost")) return true;
  if (h.endsWith(".local") || h.endsWith(".internal")) return true;

  // IPv6 literals arrive bracket-stripped from URL.hostname already.
  if (net.isIP(h)) return isBlockedAddress(h);
  return false;
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const o = Number(p);
    if (o > 255) return null;
    n = (n << 8) | o;
  }
  return n >>> 0;
}

/** IPv4 CIDRs that must never be reachable through the proxy. */
const BLOCKED_V4: readonly [string, number][] = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10], // CGNAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local (incl. 169.254.169.254 metadata)
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved
];

function inV4Cidr(ipInt: number, base: string, bits: number): boolean {
  const baseInt = ipv4ToInt(base);
  if (baseInt === null) return false;
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (ipInt & mask) === (baseInt & mask);
}

/**
 * True when a *resolved* IP address (v4 or v6) is in a loopback / private /
 * link-local / reserved range and must not be reached.
 */
export function isBlockedAddress(ip: string): boolean {
  const kind = net.isIP(ip);
  if (kind === 4) {
    const n = ipv4ToInt(ip);
    return n === null ? true : BLOCKED_V4.some(([b, bits]) => inV4Cidr(n, b, bits));
  }
  if (kind === 6) {
    const v6 = ip.toLowerCase();
    if (v6 === "::1" || v6 === "::") return true;
    // IPv4-mapped (::ffff:a.b.c.d) — check the embedded v4.
    const mapped = v6.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
    if (mapped) return isBlockedAddress(mapped[1]);
    if (v6.startsWith("fc") || v6.startsWith("fd")) return true; // fc00::/7 ULA
    if (/^fe[89ab]/.test(v6)) return true; // fe80::/10 link-local
    if (v6.startsWith("ff")) return true; // ff00::/8 multicast
    return false;
  }
  // Not an IP we recognize → fail closed.
  return true;
}

export interface HeaderRow {
  key: string;
  value: string;
}

/**
 * Build the outbound header map from key/value rows: drop empty keys + hop-by-hop
 * headers, cap the count, keep the last value when a key repeats.
 */
export function buildHeaderObject(rows: HeaderRow[] | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  let count = 0;
  for (const { key, value } of rows ?? []) {
    const k = (key ?? "").trim();
    if (!k || STRIP_HEADERS.has(k.toLowerCase())) continue;
    if (count >= MAX_HEADERS) break;
    out[k] = value ?? "";
    count++;
  }
  return out;
}

/** Methods that don't carry a request body. */
export function methodHasBody(method: string): boolean {
  const m = method.toUpperCase();
  return m !== "GET" && m !== "HEAD";
}
