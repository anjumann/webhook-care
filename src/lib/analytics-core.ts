// Pure, SDK-free analytics helpers shared by the client (posthog-js, `analytics.ts`)
// and server (posthog-node, `analytics-server.ts`) wrappers. This module imports
// *neither* SDK so it is safe to pull into both runtimes and is trivially
// unit-testable.
//
// Privacy rule (this product redacts webhook secrets — analytics must too): no
// captured payload content (bodies, headers, secrets, emails) may ever ride on an
// event. `sanitizeEventProps` is the backstop; call sites must never pass such
// content in the first place. Taxonomy + rationale: docs/specs/16-analytics-posthog.md §6.

/** The curated event vocabulary. Extend deliberately, not ad hoc. */
export type AnalyticsEvent =
  // Marketing funnel (landing + contact pages) — spec §6a.
  | "landing_cta_clicked"
  | "playground_sample_fired"
  | "contact_form_submitted"
  | "endpoint_created"
  | "first_webhook_received"
  | "onboarding_completed"
  | "request_inspected"
  | "copy_curl_clicked"
  | "provider_sample_sent"
  | "live_stream_connected"
  | "request_replayed"
  | "pagination_load_more"
  | "request_search"
  | "export_performed"
  | "request_pinned"
  | "token_created"
  | "api_client_request_sent"
  | "forwarding_url_added"
  | "account_claimed"
  // Server-side (posthog-node) events — fired off the response path.
  | "mcp_connected"
  | "rest_api_called";

export type AnalyticsProps = Record<
  string,
  string | number | boolean | null | undefined
>;

// Any prop key matching one of these (case-insensitive, substring) is dropped
// before send. This is a denylist on *keys*, not values — call sites should
// never pass payload content, and this is the backstop if one slips through.
// `email` is included: it must never ride on an *event*. It IS allowed on the
// person profile for claimed users (product decision, spec §8) — that path goes
// through `sanitizePersonProps` below, not this event denylist.
const FORBIDDEN_KEY_PATTERNS = [
  "body",
  "header",
  "payload",
  "response",
  "authorization",
  "cookie",
  "secret",
  "token",
  "password",
  "apikey",
  "api_key",
  "signature",
  "email",
];

/** Strip any prop that could carry secret/payload content. Pure + unit-tested. */
export function sanitizeEventProps(props?: AnalyticsProps): AnalyticsProps {
  if (!props) return {};
  const out: AnalyticsProps = {};
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined) continue;
    const lower = key.toLowerCase();
    if (FORBIDDEN_KEY_PATTERNS.some((p) => lower.includes(p))) continue;
    out[key] = value;
  }
  return out;
}

export type PersonProps = {
  is_claimed?: boolean;
  endpoint_count?: number;
  /** Attached only for claimed users — product decision (spec §8). */
  email?: string;
};

/**
 * Person properties use an explicit allowlist (not the event denylist), so
 * `email` is permitted here for claimed users while remaining impossible on an
 * event. Pure + unit-tested.
 */
export function sanitizePersonProps(props?: PersonProps): AnalyticsProps {
  const out: AnalyticsProps = {};
  if (!props) return out;
  if (props.is_claimed !== undefined) out.is_claimed = props.is_claimed;
  if (typeof props.endpoint_count === "number")
    out.endpoint_count = props.endpoint_count;
  if (props.email) out.email = props.email;
  return out;
}

/** Input to `buildClaimIdentity` — what we know at magic-link claim time. */
export interface ClaimUser {
  /** The canonical ULID the browser now operates as (post-merge). */
  userId: string;
  /** The pre-claim anonymous ULID this browser had, if it differs (merge case). */
  previousUserId?: string | null;
  /** The claimed email — attached to the person profile only when verified. */
  email?: string | null;
  /** Whether this claim actually verified an email (gates email attachment). */
  verified?: boolean;
  /** Optional endpoint count for the person profile. */
  endpointCount?: number;
}

/** What the client needs to stitch a claimed identity in PostHog. */
export interface ClaimIdentity {
  distinctId: string;
  /** Previous anon id to alias onto the person, when a real merge happened. */
  alias?: string;
  personProps: AnalyticsProps;
}

/**
 * Build the identity payload for a magic-link claim/merge: identify as the
 * canonical ULID, alias the previous anon ULID (only when it actually differs),
 * and attach person props. Email is attached **only** when the claim verified an
 * email (spec §8). Pure + unit-tested — no payload keys can leak (person props
 * are an allowlist).
 */
export function buildClaimIdentity(user: ClaimUser): ClaimIdentity {
  const personProps = sanitizePersonProps({
    is_claimed: true,
    endpoint_count: user.endpointCount,
    email: user.verified ? user.email ?? undefined : undefined,
  });
  const alias =
    user.previousUserId && user.previousUserId !== user.userId
      ? user.previousUserId
      : undefined;
  return { distinctId: user.userId, alias, personProps };
}

/**
 * Map an export dialog's state to `export_performed` props. `count` is the
 * best-effort number of endpoints in the export (client can't know the total in
 * single-"all" mode → omitted, then dropped by `sanitizeEventProps`). Pure +
 * unit-tested.
 */
export function buildExportProps(input: {
  multiSelect: boolean;
  scope: "this" | "all";
  selectedCount: number;
  totalCount: number;
  redacted: boolean;
  format: string;
}): AnalyticsProps {
  let count: number | undefined;
  if (input.multiSelect) count = input.selectedCount;
  else if (input.scope === "this") count = 1;
  else count = input.totalCount > 0 ? input.totalCount : undefined;
  return { count, redacted: input.redacted, format: input.format };
}

/**
 * Collapse a REST v1 request path to a low-cardinality route template for the
 * `rest_api_called` `route` prop (e.g. `/api/v1/endpoints/:id/requests`). The
 * segment following a collection name (`endpoints`/`requests`) is always a
 * resource id, so it's masked — keeps ids/names out of analytics and the
 * cardinality bounded. Pure + unit-tested.
 */
export function normalizeRestRoute(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  return (
    "/" +
    segments
      .map((seg, i) => {
        const prev = segments[i - 1];
        return prev === "endpoints" || prev === "requests" ? ":id" : seg;
      })
      .join("/")
  );
}
