/**
 * Secret redaction for captured webhook data.
 *
 * Webhook providers routinely send signatures, bearer tokens, and API keys in
 * headers (and occasionally in the body). We must never persist or return those
 * verbatim — they'd leak through the dashboard, exports, the REST API, and MCP.
 *
 * Used at write time (ingest) and by export / REST / MCP output.
 */

const REDACTED = "[REDACTED]";

/**
 * Header names whose values are sensitive. Compared case-insensitively. Entries
 * ending in `*` match by prefix (covers `x-stripe-signature`, `x-hub-signature`,
 * `x-shopify-hmac-sha256`-style vendor signatures, etc.).
 */
const SECRET_HEADER_PATTERNS: readonly string[] = [
  "authorization",
  "proxy-authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
  "api-key",
  "apikey",
  "x-auth-token",
  "x-access-token",
  "x-csrf-token",
  "x-xsrf-token",
  "x-secret",
  // signature families (prefix matches)
  "x-*-signature",
  "x-signature*",
  "x-hub-signature*",
  "x-webhook-signature*",
  "stripe-signature",
  "x-stripe-signature*",
  "x-shopify-hmac*",
  "x-slack-signature",
  "x-twilio-signature",
];

/** Body keys (case-insensitive, substring) whose values look like secrets. */
const SECRET_BODY_KEYS: readonly string[] = [
  "password",
  "secret",
  "token",
  "apikey",
  "api_key",
  "access_token",
  "refresh_token",
  "client_secret",
  "private_key",
];

function matchesPattern(name: string, pattern: string): boolean {
  const n = name.toLowerCase();
  if (pattern.includes("*")) {
    // turn the glob into a simple anchored regex (only `*` is special)
    const rx = new RegExp(
      "^" + pattern.toLowerCase().split("*").map(escapeRegex).join(".*") + "$"
    );
    return rx.test(n);
  }
  return n === pattern;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function isSecretHeader(name: string): boolean {
  return SECRET_HEADER_PATTERNS.some((p) => matchesPattern(name, p));
}

/** Return a shallow copy of headers with secret values replaced by `[REDACTED]`. */
export function redactHeaders(
  headers: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(headers)) {
    out[key] = isSecretHeader(key) ? REDACTED : value;
  }
  return out;
}

/**
 * Recursively redact obvious secret-looking keys in a parsed JSON body. Returns
 * the value unchanged when it isn't an object (we never inspect raw strings).
 */
export function redactBody<T>(body: T): T {
  if (Array.isArray(body)) {
    return body.map((v) => redactBody(v)) as unknown as T;
  }
  if (body && typeof body === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
      const isSecret = SECRET_BODY_KEYS.some((k) =>
        key.toLowerCase().includes(k)
      );
      out[key] = isSecret ? REDACTED : redactBody(value);
    }
    return out as T;
  }
  return body;
}
