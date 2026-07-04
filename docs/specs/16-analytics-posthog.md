# 16 — Product Analytics (PostHog)

> **Status: TOP PRIORITY · not yet built.** Nothing PostHog exists today
> (`@vercel/analytics` gives pageviews only). This spec is the build-from doc.
> Tracked at the top of [`../BACKLOG.md`](../BACKLOG.md) (Tier 0).

## Why this is first

We just re-ranked the entire backlog by **ROI / impact**, but we have **no
product-usage data** to ground those guesses. Product analytics turns every
future prioritization call into evidence, and specifically **de-risks the two
"Parked" bets** (AI analysis, typed integrations): if the funnel shows nobody
reaches for forwarding/integrations, parking them was right; if they do, unpark.

**North-star it serves:** measure the "land → endpoint → send → **watch it land
live** in <60s" activation loop, and show which features earn their maintenance.

## Scope

- **In:** client SDK (`posthog-js`) + server SDK (`posthog-node`), a reverse
  proxy, ULID-based identity, a curated **event taxonomy**, and the PostHog
  insights/funnels that answer the ROI questions.
- **Out (non-goals):** session replay (would record payloads — privacy risk),
  autocapture (same reason), feature flags/experiments (possible later), and any
  instrumentation of the **webhook ingest hot path** (see Privacy §4).

## 1. Packages & config

```bash
npm install posthog-js posthog-node --legacy-peer-deps   # repo peer-dep rule
```

**Env** (add to `.env` / Vercel; the file is already open):

```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx            # project API key (safe to expose)
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com   # or https://eu.i.posthog.com
```

> The server SDK reuses `NEXT_PUBLIC_POSTHOG_KEY` — no separate secret needed.
> **Region is a decision (see §8):** US default; switch all three to `eu.` for EU
> data residency. PostHog is also installable via the **Vercel Marketplace**,
> which auto-provisions these vars.

## 2. Client init — `instrumentation-client.ts` (project root)

```ts
// instrumentation-client.ts  (Next.js 15.3+ picks this up automatically)
import posthog from "posthog-js";

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: "/ingest",                 // reverse-proxied (see §3)
  ui_host: "https://us.posthog.com",   // toolbar/links target real host
  defaults: "2026-05-30",              // current defaults: auto SPA $pageview/$pageleave
  person_profiles: "identified_only",  // anonymous until we identify() → 4x cheaper
  autocapture: false,                  // we send explicit events only (privacy, §4)
  capture_exceptions: true,            // cheap error signal
  disable_session_recording: true,     // never record payload DOM
});
```

`defaults: '2026-05-30'` enables PostHog's current recommended bundle, including
**automatic pageview + pageleave capture on History API navigation** — so App
Router route changes are tracked without a manual `$pageview` component. *(Fallback
if a version regresses: a tiny client component calling `posthog.capture('$pageview')`
on `usePathname()`/`useSearchParams()` change.)*

## 3. Reverse proxy — `next.config.ts`

Routes analytics through our own domain so ad-blockers don't eat events:

```ts
async rewrites() {
  return [
    { source: "/ingest/static/:path*", destination: "https://us-assets.i.posthog.com/static/:path*" },
    { source: "/ingest/array/:path*",  destination: "https://us-assets.i.posthog.com/array/:path*" },
    { source: "/ingest/:path*",        destination: "https://us.i.posthog.com/:path*" },
  ];
},
skipTrailingSlashRedirect: true,   // PostHog endpoints use trailing slashes (/e/)
```

## 4. Privacy & security (this product redacts secrets — analytics must too)

Non-negotiable, matching the app's redaction ethos:

1. **Never send payloads.** No webhook headers/bodies/URLs-with-secrets ever reach
   PostHog. Events carry only IDs, counts, enums, booleans — no captured content.
2. **Autocapture OFF + no session replay.** The inspector renders payload text in
   the DOM; autocapture/replay could exfiltrate it. Explicit `capture()` only.
3. **Keep the ingest hot path pristine.** Do **not** instrument
   `POST /api/webhook/...` — CLAUDE.md forbids blocking work there, and
   `Endpoint.requestCount` already measures volume. Server-side events
   (`mcp_connected`, `rest_api_called`) fire from *management* routes via Next
   `after()` / `waitUntil` so they never block a response, with
   `flushAt: 1, flushInterval: 0` + `await posthog.shutdown()`.
4. **Pseudonymous identity.** `distinct_id` = the ULID (`User.userId`), which is
   not PII. Send `email` as a person property **only** for claimed (verified)
   users, who opted into identity — decision in §8.
5. **Consent / cookies.** PostHog uses cookies/localStorage. Add a PostHog line to
   `privacy-policy`; evaluate a lightweight consent posture or cookieless mode
   (`persistence: 'memory'`) — decision in §8.

## 5. Identity model (fits anonymous-first)

- On app load with a known ULID → `posthog.identify(userId, { is_claimed, endpoint_count })`.
- Landing/marketing visitors (no ULID yet) stay **anonymous** (cheap, no profile).
- On **magic-link claim / device merge** → `posthog.identify(canonicalUserId)` and
  `posthog.alias(previousAnonId)` so pre-claim events stitch to the person. This
  mirrors the existing server-side account-merge in `services/users`.
- Server SDK: pass the same ULID as `distinctId` so client + server events share
  one identity across the stack.

## 6. Event taxonomy (the actual deliverable)

Curated, low-volume, high-signal. Names `snake_case`, props minimal.

| Event | Where | Props | Answers |
|---|---|---|---|
| `endpoint_created` | dashboard/onboarding | `has_forwarding`, `source` | activation |
| `first_webhook_received` | detail (first row) | `seconds_since_create` | **<60s core-loop** |
| `onboarding_completed` | onboarding | `steps` | activation funnel |
| `request_inspected` | inspector | — | core-loop depth |
| `copy_curl_clicked` | inspector | — | **validates Tier-1 copy-as-cURL** |
| `provider_sample_sent` | detail | `provider` | validates provider samples |
| `live_stream_connected` | inspector | — | **validates live-SSE ROI** |
| `request_replayed` | inspector | `target` | validates replay (when built) |
| `pagination_load_more` | inspector | — | validates pagination need |
| `request_search` | inspector | — | validates search need |
| `export_performed` | export dialog | `count`, `redacted` | **is export used?** |
| `request_pinned` | inspector | — | retention feature use |
| `token_created` | settings | — | agent-access adoption |
| `mcp_connected` | `/api/mcp` (server, `after()`) | — | **differentiator use** |
| `rest_api_called` | `/api/v1/*` (server, sampled) | `route` | REST adoption |
| `api_client_request_sent` | api-client | — | is the client used? |
| `forwarding_url_added` | create/edit | — | **validates parked integrations** |
| `account_claimed` | verify | — | identity conversion |

Person props (identified): `is_claimed`, `endpoint_count`, `created_at`, `email?`.

## 7. Insights to build in PostHog (so the data is actually used)

1. **Activation funnel:** `$pageview` (landing) → `endpoint_created` →
   `first_webhook_received` → `request_inspected`. The core-loop truth.
2. **Feature-adoption breakdown:** % of active users hitting `export_performed` /
   `token_created` / `mcp_connected` / `api_client_request_sent` /
   `forwarding_url_added` — **directly answers "is X worth it" and the parked bets.**
3. **Tier-1/2 validation** (post-ship): `copy_curl_clicked`, `provider_sample_sent`,
   `live_stream_connected`, `request_replayed` trends — proves the ROI ranking.
4. **Weekly retention** of identified users.

## 8. Decisions — RESOLVED (2026-07-04)

1. **Region:** ✅ **US** (`us.i.posthog.com`). Wired in P0a.
2. **Email as person property:** ✅ **Attach** for claimed (verified) users —
   via `sanitizePersonProps` (allowlist), never on events. Must be named in the
   privacy policy (P0c). P0b wires it into `identify`/`alias` on claim.
3. **Consent posture:** ✅ **Privacy-policy line only** — cookies set normally
   (retention analytics intact), no banner, no cookieless mode. P0c adds the line.

## 9. Acceptance criteria

- Events visible in PostHog Live Events from both client and a server route.
- Anonymous landing visitors create **no** person profile; a dashboard user with a
  ULID does, with `is_claimed`/`endpoint_count` set.
- Zero payload content in any event (spot-check `export_performed`, `request_inspected`).
- The webhook ingest route is **untouched**; `npm run build` + `tsc` + tests green.
- The three insights in §7 exist in PostHog.

## 10. Testing (write tests **alongside** each slice — not after)

Every slice lands with its unit tests in the same change; extract the bug-prone
pure logic and test it, skip hollow tests for click-wiring UI.

**Done (P0a):** `sanitizeEventProps` (drops payload/secret keys, incl. email on
events), `sanitizePersonProps` (allowlist; email permitted for the person profile).

**P0b test targets (pure logic to extract + cover):**
- `lib/analytics-server.ts` — `shouldSample(key, rate)` is **deterministic**
  (hash-based, not `Math.random`) → test boundaries (rate 0 = never, 1 = always,
  stable per key); and the no-op guard when `NEXT_PUBLIC_POSTHOG_KEY` is unset.
- **Claim identity builder** — `buildClaimIdentity(user)` → `{ distinctId, alias,
  personProps }`; test that email is attached only when verified, `is_claimed`
  set, and no payload keys leak.
- **Event-prop builders** where non-trivial (e.g. `export_performed` → `{ count,
  redacted }`) — test the mapping; trivial static events don't need a test.

**Manual (P0c/verify):** fire each event → confirm in PostHog Live Events; verify
anon→identified stitch after a magic-link claim; confirm `/ingest/decide` → 200
(already smoke-passed in P0a).

## Sources

- [PostHog · Next.js library](https://posthog.com/docs/libraries/next-js)
- [PostHog · Next.js reverse proxy](https://posthog.com/docs/advanced/proxy/nextjs)
- [PostHog · Anonymous vs identified events](https://posthog.com/docs/data/anonymous-vs-identified-events)
- [PostHog · Identifying users](https://posthog.com/docs/product-analytics/identify)
