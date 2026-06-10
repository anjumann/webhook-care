/**
 * Resolve the public origin used to build absolute links (magic-link emails,
 * job callbacks). Prefers the configured `APP_URL`; falls back to the incoming
 * request's forwarded host so a missing/empty env can never produce a
 * domain-less, broken link (e.g. `/auth/verify?token=…` with no host).
 *
 * Pure + dependency-light so it's unit-testable without a request.
 */
export function resolveOrigin(input: {
  /** `process.env.APP_URL` — the canonical custom domain when set. */
  configured?: string | null;
  /** `x-forwarded-host` header (the public host behind a proxy like Vercel). */
  forwardedHost?: string | null;
  /** `host` header (fallback when no forwarded host). */
  host?: string | null;
  /** `x-forwarded-proto` header; defaults to https. */
  forwardedProto?: string | null;
}): string {
  const configured = (input.configured ?? "").trim().replace(/\/+$/, "");
  if (configured) return configured;

  const host = (input.forwardedHost ?? input.host ?? "").trim();
  if (!host) return "";

  const proto = (input.forwardedProto ?? "https").trim() || "https";
  return `${proto}://${host}`;
}
