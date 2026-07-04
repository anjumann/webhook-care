# Backlog

The one list of what's left to build, **ranked by ROI (impact per hour)**.
Everything shipped (backend B.0–B.8, identity, retention, export, REST, MCP,
relay/CLI, API client, PWA, and most of the redesign) is summarized in
[`archive/PROGRESS.md`](./archive/PROGRESS.md) and no longer tracked here.

Effort tags are grounded in what already exists in the codebase. Specs for the
unbuilt surfaces live in [`specs/`](./specs/).

_North-star:_ land → get an endpoint → send a webhook → **watch it land live** in
under a minute. The differentiator (agent-native access: MCP + REST + relay) is
**already shipped**; what's missing is mostly the core-loop promise the landing
page already advertises.

---

## 🟢 Now / Next (real backlog)

### Tier 0 — Product analytics (PostHog) · **TOP PRIORITY**

**Why first:** this whole list is ranked by "impact," but we have no usage data to
ground it. Analytics turns ROI guesses into evidence and de-risks the Parked bets.
Full spec: [`specs/16`](./specs/16-analytics-posthog.md).

- [x] **P0a — SDK + proxy + identity** — DONE (US region). `posthog-js` init in
  `src/instrumentation-client.ts` (`identified_only`, autocapture + replay off);
  `/ingest` reverse proxy in `next.config.ts` (proxy smoke: `/ingest/decide`→200);
  `identifyUser(ULID)` wired in `SessionProvider`; typed `lib/analytics.ts` helper
  with a payload-key denylist (unit-tested); OTLP server logs → PostHog in
  `src/instrumentation.ts`. _Residual (`alias()` on magic-link claim/merge) done
  in P0b._
- [x] **P0b — Event taxonomy** — DONE. Pure SDK-free core extracted to
  `lib/analytics-core.ts` (sanitizers + `buildClaimIdentity` + `buildExportProps` +
  `normalizeRestRoute`); new `lib/analytics-server.ts` (posthog-node, deterministic
  `shouldSample`, no-op-without-key guard, ephemeral-client `captureServer` flushed
  via `after()` — **ingest hot path untouched**). Client events wired:
  `endpoint_created`(+`has_forwarding`,`source`), `forwarding_url_added` (only when
  the saved set grows), `request_inspected`, `request_pinned`, `export_performed`
  (`count`/`redacted`/`format`), `token_created`, `api_client_request_sent`,
  `first_webhook_received` (`seconds_since_create`, once-per-endpoint gate), and
  `account_claimed`+`alias()`+email on magic-link claim. Server events:
  `mcp_connected` (sampled, `after()`) and `rest_api_called` (`route`, sampled at
  the `requireToken` chokepoint). Tests alongside (sampler boundaries/determinism,
  claim-identity, export + route builders). tsc + **163 tests** + build green. The
  other 6 events ship *with* their feature.
- [ ] **P0c — Insights + privacy** — _privacy done_ (PostHog named in
  `privacy-policy`: never sends webhook content, email attached only for claimed
  users, no replay/autocapture). **Remaining:** build the activation funnel +
  feature-adoption breakdown + retention insight in the PostHog UI (keys are set
  in `.env`; this is a dashboard task, not code).
- **Decisions RESOLVED (2026-07-04):** region **US** · email-as-person-property
  **attach for claimed users** · **privacy-line-only** consent. See
  [`specs/16` §8](./specs/16-analytics-posthog.md).

### Tier 1 — cheap + high value (do first)

- [x] **Copy-as-cURL** — DONE. Pure `lib/curl.ts` `buildCurl({url,method,headers,
  body,query})` (POSIX-safe single-quoting, drops hop-by-hop/host headers, appends
  captured query, JSON-or-raw body) + unit tests. Wired as a "Copy as cURL" row
  action in the inspector (`request-list.tsx`), fed the endpoint's webhook URL;
  fires `copy_curl_clicked`. Spec: [`specs/05`](./specs/05-endpoint-detail-inspector.md).
- [x] **Detail pagination ("load more") + server-side search** — DONE. Fixes the
  bug where search filtered a single client-loaded page. Pure
  `buildRequestSearchFilter` (in `services/requests.ts`) searches the **String**
  columns server-side — `rawBody` (verbatim payload, covers body text for every
  content-type), `method`, `contentType` (all `contains`, `mode:"insensitive"` →
  RegEx on the Mongo connector) + exact `statusCode` for integer queries;
  `body`/`headers`/`query` Json columns are intentionally excluded (Mongo+Prisma
  can't reliably case-insensitively filter inside Json). Detail GET passes
  `search` through; `useGetEndpoint(id, search)` folds the debounced term into the
  SWR key; a cursor-driven **Load more** appends pages via `fetchRequestPage`.
  Fires `request_search` + `pagination_load_more`. Tests: filter builder +
  `listRequests` search branch. _(Note: search matches body/method/status/
  content-type, not headers — stated tradeoff.)_
- [x] **Provider samples / "send test"** — DONE. One-click Stripe/GitHub/Shopify/
  Custom sample buttons in the playground (`webhook-test-section.tsx`) reuse the
  unit-tested `buildSampleRequest` fixtures and POST straight to the live endpoint
  (dropping the non-ASCII `REDACTED` pseudo-signature so `fetch` accepts the
  headers). Fires `provider_sample_sent{provider}`; added an `onSent` callback so
  the detail page `mutate()`s and the sample **lands in the list immediately**.
- [x] **1-click first-run onboarding** — DONE (the locked §3 decision). First time
  a browser lands on the dashboard with **zero** endpoints, `EndpointList`
  auto-creates a friendly starter (`generateStarterName` → `swift-otter`, pure +
  tested) and routes straight to its detail page with `?isNew=true` (playground
  opens = the "send your first webhook" nudge). Idempotent via a `wcat_onboarded`
  localStorage flag (once per browser; no re-create after delete-all/refresh);
  shows a "Setting up…" state, falls back to the manual empty state on failure.
  Fires `endpoint_created{source:"onboarding"}` + `onboarding_completed{steps:1}`.
  Spec: [`specs/02`](./specs/02-onboarding-activation.md). _Residual: the SSE "aha"
  celebration + claim nudge (§5.2) wait on the live stream + spec 09._

### Tier 2 — medium effort, high value

- [x] **Live SSE inspector** — DONE (the north-star). New owner-guarded stream
  route `GET /api/endpoints/[id]/stream` (session-cookie auth via
  `requireOwnerOfEndpoint`; clone of the relay's SSE-from-DB loop, cursor-tailed
  off `([endpointId, createdAt])`, self-closes ~280s with a `reconnect` hint).
  New `liveRequestsAfter`/`LIVE_SELECT` service (richer inspector fields than the
  CLI relay) + `useRequestStream` `EventSource` hook (graceful reconnect at
  cursor, error backoff + cap). Detail page: Live toggle (**on by default**,
  pauses during search), live rows prepended + deduped, status pill; fires
  `live_stream_connected`. Tests: `liveRequestsAfter` ordering/cursor/clamp.
  Smoke: unauth request is JSON-404'd **before** any stream (guard proven).
  _Residual: happy-path browser verification (EventSource render) is a manual
  step; the "aha" celebration on first live row (spec 02 §5.2) is still open._
- [ ] **Replay** — re-POST a stored request. **Open design Q:** replay to the
  *endpoint* (re-ingest) or to the *forwarding target*? Decide before building.
  Spec: [`specs/05`](./specs/05-endpoint-detail-inspector.md). _~3–5h._

### Tier 3 — polish / consistency

- [ ] **Finish the redesign remainder** — Playground (`WebhookTestSection`) +
  Profile screens still render pre-redesign markup inside the new shell.
- [ ] **Accessibility pass** — icon+text labels, focus management, ARIA live
  regions (esp. once the live stream lands).
- [ ] **Restyle remaining shadcn primitives** — button/input/table/tabs to the
  emerald tokens (`live-tag`, `kv-editor`, `json-view` still pending).
  Design reference: [`archive/UI-redesign/`](./archive/UI-redesign/).

---

## 🟡 Someday — real, but not yet worth the hours

- [ ] **Custom responses** (static status/body/headers/delay) — needs a schema +
  an ingest hot-path change. Spec: [`specs/06`](./specs/06-custom-responses.md).
- [ ] **Type-gen** (TS / JSON-Schema / Zod from a payload) — neat differentiator,
  niche. Spec: [`specs/05`](./specs/05-endpoint-detail-inspector.md).
- [ ] **Full responsive / mobile** — sidebar drawer + table→card collapse. A
  webhook tool is desktop-first; the inspect loop matters most on mobile.
  Spec: [`specs/15`](./specs/15-responsive-mobile.md).

---

## 🔴 Parked — needs a product reason before building

These are **not** scheduled work. They carry real upkeep for uncertain value on an
all-free tool. Specs kept in `specs/` in case we revisit; don't build without a
usage signal.

- [ ] **AI payload analysis (BYOK)** — `GROQ_API_KEY` is set but nothing is wired.
  Parking rationale: BYOK adds key-encryption + multi-provider SDK upkeep for a
  feature with no evidence of demand. Spec: [`specs/12`](./specs/12-ai-analysis.md).
- [ ] **Typed forwarding integrations** (Slack/Telegram/Discord targets + catalog
  + Integrations nav) — raw-URL fire-and-forget forwarding **and** the relay/CLI
  already cover the real forwarding need; typed formatters are a lot of surface
  for marginal gain. Spec: [`specs/07`](./specs/07-forwarding-integrations.md).

---

## ⚙️ Deploy-time ops (not features)

- [ ] **PostHog keys** (`NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`) —
  needed for Tier 0. Create a project (US or EU) or install via Vercel Marketplace.
- [ ] **Upstash Redis** (`UPSTASH_REDIS_REST_URL`/`_TOKEN`) — rate limiting is
  wired but no-op until set; also activates per-token REST/MCP limits.
- [ ] **Rotate QStash signing keys** — leaked into a session transcript 2026-06-11.
- [ ] **Session legacy index** — stale unique `sessionToken` index breaks 2nd+
  verified login (P2002). See the `session-legacy-index` memory.

---

## Explicitly deferred (Phase-2, intentional — from the original plan)

Pre-expiry export email · async large export → Blob · OAuth 2.1 for MCP ·
`search_requests` MCP tool · startup env validation · E2E auth-flow browser test ·
at-ingest Redis tee (push un-redacted originals to live relay listeners).
