# Architecture

How Webhook Catcher actually works today (B.0–B.8 backend + PostHog analytics +
inspector power tools). This is the living reference; the 2026-06-09 snapshot is preserved
verbatim at [`archive/01-architecture.md`](./archive/01-architecture.md).

> Stack: **Next.js 15** (App Router) · **React 19** · **MongoDB via Prisma**
> (client generated to `generated/prisma/`) · **Tailwind v4 + shadcn/ui** ·
> deployed on **Vercel**. Anonymous-first identity (ULID in `localStorage`),
> optional magic-link claim. All-free, 30-day retention.

## The layering rule

```
route handlers / jobs / MCP / REST  →  services/*  →  Prisma
        (thin: validate → call → shape)     (all DB access + business logic)
```

- **`src/app/**`** — pages + `api/*` route handlers. Routes stay thin: Zod-validate
  input, call a service, shape the response with `lib/http` helpers + `parseError`.
- **`src/services/**`** — the **only** place Prisma is touched. One query path =
  one source of truth for auth, pagination, filtering. Routes never import Prisma.
- **`src/lib/**`** — cross-cutting utils: `prisma` (singleton), `http`, `error`,
  `redact`, `ratelimit`, `api-token`, `auth`, `sse`, `guarded-fetch`, `app-url`,
  `curl` (`buildCurl` for copy-as-cURL), and the analytics trio `analytics-core`
  (pure, SDK-free) / `analytics` (client posthog-js) / `analytics-server`
  (posthog-node) — see [Product analytics](#product-analytics).
- **`src/endpoints/types.ts`** — single source for shared `Endpoint` / `Request` /
  `ForwardingUrl` shapes. Import from here; never redefine inline.
- **`src/components/console/**`** — the Emerald Console UI shell.

## Data model (`prisma/schema.prisma`)

| Model | Purpose | Key indexes |
|---|---|---|
| **User** | ULID `userId` is the identity key (**not** Mongo `_id`). `email` optional. | `userId @unique`; `email` **partial** unique via `scripts/ensure-email-index.mjs` (not Prisma `@unique` — see CLAUDE.md) |
| **Endpoint** | A catch URL (`/webhook/:userId/:name`). Holds `requestCount`, `retentionDays` (default 30), forwarding URLs. | `[userId, name]` |
| **Request** | A captured webhook — redacted `headers`/`body` + verbatim `rawBody`, `contentType`, `pinned`, `expiresAt`. **Grows unbounded.** | `[endpointId]`, `[endpointId, createdAt]` (cursor pagination + relay tail), `[expiresAt]` (retention sweep) |
| **ForwardingUrl** | Fire-and-forget forward targets on an endpoint. | — |
| **Session** | Verified login (magic-link). Stores `sha256(token)` only. | `userId`, `expiresAt` |
| **MagicLink** | Pending single-use claim token (hash only). | `email`, `expiresAt` |
| **ApiToken** | Read-only PAT for REST + MCP. Stores `sha256`, shows raw `wcat_…` once. | `userId` |

## The ingest hot path (highest-traffic code)

`POST /api/webhook/[userId]/[name]` → `handleWebhook` (all methods). Kept lean:

1. `rateLimit("ingest", clientIp)` — one awaited call, **fails open** (no-op
   until Upstash env is set).
2. `findEndpointForIngest(userId, name)` — 404 if unknown.
3. Read the raw body **once** (`request.text()`), capped at ~1 MB. Parse JSON /
   form when the `Content-Type` is known; **never silently drop** an unknown type
   — `rawBody` is always stored verbatim.
4. `captureRequest(...)` persists a **redacted** copy (`redactHeaders`/`redactBody`
   scrub auth/signature/cookie secrets) + `rawBody`, and bumps `requestCount`.
5. **Forwarding is fire-and-forget** (`void Promise.allSettled(...)`) with the
   **original** (un-redacted) headers/body so downstream signature checks pass.
   Never awaited — it must not block capture. (Deliberate on the free plan.)

## Auth model — three guards, never hand-rolled

| Surface | Guard | Identity source |
|---|---|---|
| Dashboard / management routes | `requireOwner(userId)` / `requireOwnerOfEndpoint(id)` / `requireOwnerOfRequest(id)` from `@/services/auth` | Session cookie: anon (stateless ULID) or `s:`-prefixed verified |
| Agent REST (`/api/v1/*`) + MCP | `requireToken(req, scope)` from `@/lib/api-token` | Bearer PAT → `userId` + read-only scopes |
| Jobs (`/api/jobs/*`) | QStash signature verification | Never publicly callable |

The public webhook ingest is the **only** intentionally-open write path.

## Surfaces

- **Dashboard** (`/dashboard/[userId]/…`) — endpoints list, create/edit, detail +
  inspector, API client, settings (profile, tokens). Emerald Console shell.
  **First-run onboarding:** landing on the dashboard with zero endpoints
  auto-creates a friendly starter (`generateStarterName`) once per browser
  (`wcat_onboarded` localStorage guard) and routes to its detail page — no form.
  Inspector power tools: **copy-as-cURL** (per captured request, via `buildCurl`)
  and a playground with **one-click provider samples** (Stripe/GitHub/Shopify/
  Custom) that POST real traffic to the endpoint and refresh the list on land.
  The request log is **server-paginated** ("Load more" via a `createdAt`+`id`
  cursor) with **server-side search** (`buildRequestSearchFilter`): a debounced
  term folds into the SWR key and matches `rawBody`/`method`/`contentType`
  case-insensitively (+ exact `statusCode` for integer queries). Json columns
  (`body`/`headers`/`query`) are excluded — the Mongo+Prisma connector can't
  reliably case-insensitively filter inside Json, and `rawBody` already holds the
  verbatim body text. Never filters a client-loaded page.
- **Agent REST** (`/api/v1/*`) — `endpoints`, `endpoints/[id]/requests`,
  `requests/[id]`, all PAT-scoped + cursor-paginated.
- **MCP server** (`/api/mcp`) — static route, Streamable HTTP, `disableSse`. Tools
  (`list_endpoints`, `get_requests`, `get_request`) delegate to `services/mcp.ts`;
  auth reuses `resolveToken` so revoking a PAT kills MCP too.
- **Live inspector stream** (`/api/endpoints/[id]/stream`) — the dashboard
  "watch it land live" SSE stream. Owner-guarded by the **session cookie**
  (`requireOwnerOfEndpoint`; `EventSource` sends it automatically), same
  cursor-tailed SSE-from-DB loop as the relay but with the richer `liveRequestsAfter`
  select so a streamed row renders a full inspector row. Client hook
  `useRequestStream` reconnects at the cursor on the server's `reconnect` hint or a
  network drop, so no capture is missed. Streams the **stored redacted** copy.
- **Live relay** (`/api/v1/relay`) — the same SSE-from-DB pattern for the
  `cli/wcat.mjs` bridge (`wcat listen --forward localhost:3000`), but authed by a
  **bearer PAT** (`requireToken`). Cursor-tailed off `[endpointId, createdAt]`,
  self-closes ~280s with a `reconnect` hint. Streams the **stored redacted** copy
  (signature headers arrive `[REDACTED]` — known limit).
- **API client** (`/api-client`) — client-side request composer over the
  SSRF-guarded `POST /api/tools/http` proxy. Saved requests + history in IndexedDB;
  auth headers never hit our servers.
- **PWA** — manifest + app-shell service worker + install prompt.

## Retention

`Request.expiresAt = createdAt + endpoint.retentionDays`. A QStash-signed nightly
job (`/api/jobs/retention`, `0 0 * * *`) sweeps expired rows; a Mongo **TTL index**
(`Request_expiresAt_idx`, via `npm run db:ttl-index`) is the safety net Prisma
can't express. **Pinning a request nulls `expiresAt`** (unpinning recomputes it),
exempting it from both the sweep and the TTL index. Dry-run: `?dryRun=true` /
`RETENTION_DRY_RUN=true`. Needs a public `APP_URL` (QStash can't call localhost).

## Product analytics

PostHog, wired to measure the activation loop and feature adoption. Full spec +
event taxonomy: [`specs/16`](./specs/16-analytics-posthog.md).

- **Client** (`posthog-js`) inits in `src/instrumentation-client.ts`
  (`identified_only`, autocapture + session replay **off**), proxied through
  `/ingest` (rewrites in `next.config.ts`) so ad-blockers don't eat events.
  `identifyUser(ULID)` runs in `SessionProvider`; a magic-link claim calls
  `applyClaimIdentity` (identify canonical ULID + `alias()` the pre-claim anon id
  + attach email).
- **Server** (`posthog-node`) — `lib/analytics-server.ts` fires the two
  server-only events (`mcp_connected`, `rest_api_called`) via Next `after()` (off
  the response path) with an ephemeral `flushAt:1` client + `shutdown()`, sampled
  by a deterministic `shouldSample`. `rest_api_called` is emitted once at the
  `requireToken` chokepoint with a **masked** route template (no ids). Server logs
  also ship to PostHog via OTLP (`src/instrumentation.ts`).
- **Pure core** — `lib/analytics-core.ts` holds the SDK-free logic shared by both:
  the event vocabulary, `sanitizeEventProps` (event key **denylist** — never lets
  payload/secret/email content through), `sanitizePersonProps` (person **allowlist**
  — email permitted only here, for claimed users), and the builders
  `buildClaimIdentity` / `buildExportProps` / `normalizeRestRoute`.
- **Privacy invariants:** never send webhook content; email only on the claimed
  person profile, never on an event; the **ingest hot path is never instrumented**;
  no-op without `NEXT_PUBLIC_POSTHOG_KEY` (CI/builds stay clean).

## Cross-cutting invariants (don't break these)

- **No unbounded queries.** Every list takes a `take` + cursor (`createdAt` + `id`);
  `select` only what you use. Assume 100k requests per endpoint.
- **Redact at write time** via `lib/redact` before persisting/returning.
- **Validate external input with Zod** at the boundary; guard every `JSON.parse`.
- **Rate limiting is no-op + fail-open** until Upstash env is set — keep it that way.
- **SSRF guards** on `/api/tools/http`: `requireOwner`, http(s)-only + blocked
  hosts, **DNS-resolve + re-check every IP** against private ranges, timeout + cap.

> Deeper history / rationale lives in [`archive/`](./archive/) — the original
> architecture, audit, feature designs, PRDs, and the full build log (`PROGRESS.md`).
