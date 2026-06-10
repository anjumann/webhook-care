/**
 * Pure fixture logic for the landing demo playground. The playground is a
 * simulation — no network, no persistence — but it mirrors real product
 * behaviour: bodies are valid JSON and signature/auth headers appear redacted,
 * exactly as `lib/redact` would store them. Deterministic in (kind, seq) so
 * the UI (and tests) can rely on stable output.
 */

export type PlaygroundKind = "stripe" | "github" | "shopify" | "custom";

export interface PlaygroundRequest {
  id: string;
  kind: PlaygroundKind;
  source: string;
  event: string;
  method: "POST";
  /** [name, value] pairs as the console would display them (post-redaction). */
  headers: [string, string][];
  /** Pretty-printed JSON body. */
  body: string;
}

export const REDACTED = "•••••• redacted";

export const PLAYGROUND_KINDS: PlaygroundKind[] = [
  "stripe",
  "github",
  "shopify",
  "custom",
];

const JSON_HEADER: [string, string] = ["content-type", "application/json"];

export function buildSampleRequest(
  kind: PlaygroundKind,
  seq: number
): PlaygroundRequest {
  const id = `${kind}-${seq}`;
  switch (kind) {
    case "stripe":
      return {
        id,
        kind,
        source: "Stripe",
        event: "payment_intent.succeeded",
        method: "POST",
        headers: [JSON_HEADER, ["stripe-signature", REDACTED]],
        body: pretty({
          type: "payment_intent.succeeded",
          data: {
            amount: 1900 + seq * 100,
            currency: "usd",
            customer: `cus_${(1000 + seq).toString(36)}`,
          },
        }),
      };
    case "github":
      return {
        id,
        kind,
        source: "GitHub",
        event: "push · main",
        method: "POST",
        headers: [
          JSON_HEADER,
          ["x-github-event", "push"],
          ["x-hub-signature-256", REDACTED],
        ],
        body: pretty({
          ref: "refs/heads/main",
          commits: [{ id: `c${seq}f2a91`, message: "fix: retry queue" }],
        }),
      };
    case "shopify":
      return {
        id,
        kind,
        source: "Shopify",
        event: "orders/create",
        method: "POST",
        headers: [
          JSON_HEADER,
          ["x-shopify-topic", "orders/create"],
          ["x-shopify-hmac-sha256", REDACTED],
        ],
        body: pretty({
          order_number: 1000 + seq,
          total_price: `${(49 + seq).toFixed(2)}`,
          line_items: [{ title: "Emerald hoodie", quantity: 1 }],
        }),
      };
    case "custom":
      return {
        id,
        kind,
        source: "curl",
        event: "your-event",
        method: "POST",
        headers: [JSON_HEADER, ["user-agent", "curl/8.6.0"]],
        body: pretty({ event: "your-event", attempt: seq, hello: "world" }),
      };
  }
}

function pretty(value: unknown): string {
  return JSON.stringify(value, null, 2);
}
