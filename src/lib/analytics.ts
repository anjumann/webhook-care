// Typed client-side analytics wrapper over posthog-js.
//
// Why a wrapper: (1) a closed event vocabulary keeps call sites honest and the
// PostHog project clean; (2) `sanitizeEventProps` enforces this app's core
// privacy rule — captured payload content (bodies, headers, secrets, emails)
// must NEVER leave for analytics. Every event goes through it.
//
// The pure, SDK-free helpers (types, sanitizers, identity builders) live in
// `analytics-core.ts` so they can be shared with the server wrapper without
// pulling posthog-js into a Node bundle. Taxonomy: docs/specs/16-analytics-posthog.md §6.
import posthog from "posthog-js";
import {
  sanitizeEventProps,
  sanitizePersonProps,
  type AnalyticsEvent,
  type AnalyticsProps,
  type PersonProps,
  type ClaimIdentity,
} from "./analytics-core";

// Re-export the pure surface so existing import sites (`@/lib/analytics`) keep
// working — one canonical vocabulary, whether imported from here or core.
export * from "./analytics-core";

/** Capture a curated event. Never throws — analytics must not break the app. */
export function track(event: AnalyticsEvent, props?: AnalyticsProps): void {
  try {
    posthog.capture(event, sanitizeEventProps(props));
  } catch {
    /* swallow — analytics is best-effort */
  }
}

/**
 * Bind this browser's anonymous ULID to a person profile. With
 * `person_profiles: 'identified_only'`, calling this is what promotes the user
 * from anonymous to identified (enables funnels/retention).
 */
export function identifyUser(userId: string, props?: PersonProps): void {
  try {
    const person = sanitizePersonProps(props);
    posthog.identify(userId, Object.keys(person).length ? person : undefined);
  } catch {
    /* swallow */
  }
}

/**
 * Apply a magic-link claim: identify as the canonical ULID (with person props,
 * incl. email for verified users) and alias the pre-claim anon ULID so events
 * captured before the claim stitch to the same person. Build the payload with
 * `buildClaimIdentity` (pure). See spec §5.
 */
export function applyClaimIdentity(identity: ClaimIdentity): void {
  try {
    posthog.identify(
      identity.distinctId,
      Object.keys(identity.personProps).length ? identity.personProps : undefined
    );
    if (identity.alias) posthog.alias(identity.alias);
  } catch {
    /* swallow */
  }
}

/** Clear identity (call on sign-out) so the next user starts fresh. */
export function resetAnalytics(): void {
  try {
    posthog.reset();
  } catch {
    /* swallow */
  }
}
