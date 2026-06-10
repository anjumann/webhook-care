# Build Progress

Status of the `docs/04-implementation-plan.md` build plan. `[x]` done & verified
(tsc + `npm test` + `next build` green), `[ ]` not started.

_Last updated: 2026-06-10._

## B.0 — Foundations
- [x] `CLAUDE.md` with Performance & Best-Practices + Testing policy
- [x] Prisma hygiene — `generated/` git-ignored + untracked, `postinstall: prisma generate`
- [x] Consolidated shared types in `src/endpoints/types.ts` (no drift copies)
- [x] Service layer `src/services/{users,endpoints,requests}.ts`
- [x] Routes refactored to validate (Zod) → service → `lib/http` responses
- [x] `src/lib/redact.ts` (secret-header/body redaction)
- [x] `src/lib/http.ts` (response helpers + `failFromError`)
- [x] Cursor pagination for requests (+ `@@index([endpointId, createdAt])`)
- [x] Bug fixes — avatar double-prefix, profile URL trailing spaces, playground `JSON.parse`, header avatar `src`
- [x] `src/lib/ratelimit.ts` (Upstash sliding-window) — **no-op when Redis env absent, fails open on Redis error** (never drops legit traffic); buckets: `ingest` (100/min/IP), `magicLink` (5/h per IP + per email), `token` (120/min/token), `export` (10/h/user), `apiClient` (60/min/user); `clientIp()` from proxy headers. Wired into webhook ingest, `/api/auth/magic-link`, `/api/export`, `/api/tools/http`, `requireToken` (REST `/v1/*`), and the MCP auth callback (429 before any tool). Enforced path needs live Upstash creds (deploy-time op); no-op + fail-open + `clientIp` unit-tested, fail-open runtime-verified
- [x] `src/lib/api-token.ts` (PAT resolver — `generateToken`/`resolveToken`/`requireToken`, used by REST + MCP)

## B.1 — Retention (30-day auto-delete) ✅
- [x] Schema: `Request.pinned` / `expiresAt` / `rawBody` / `contentType`, `Endpoint.retentionDays` (+ `expiresAt` index)
- [x] Webhook ingest captures all content-types + raw body, sets `expiresAt`, redacts secrets
- [x] Pin/unpin a request (`PATCH /api/requests/[id]`) — now also nulls/recomputes `expiresAt` so pins are exempt from sweep **and** TTL
- [x] `POST /api/jobs/retention` (QStash-signed, bounded find→deleteMany batch loop) + `deleteExpiredRequests()` service
- [x] Mongo TTL safety net — `scripts/ensure-ttl-index.mjs` (`npm run db:ttl-index`) upgrades `Request_expiresAt_idx` to TTL
- [x] Dry-run flag — `RETENTION_DRY_RUN=true` or `?dryRun=true` (counts, no deletes)
- [x] UI: "expires in N days" / "Kept" chips, pin/unpin button, per-endpoint retention selector (24h/7d/30d)
- [x] Mongo TTL index **applied to the dev cluster** (`Request_expiresAt_idx`, `expireAfterSeconds:0`, verified via `listIndexes`)
- [ ] **Op (still pending):** create the QStash midnight schedule (`0 0 * * *` → `/api/jobs/retention`) — blocked until `APP_URL` is a public deploy URL (QStash can't call `localhost`). Re-run `db:ttl-index` against prod when it differs from dev.

## B.2 — Magic-link identity + auth guards (P0) ✅
- [x] Schema: `User.email` / `emailVerifiedAt`, `MagicLink`, `Session`
- [x] `User.email` uniqueness via a **partial** unique index (`scripts/ensure-email-index.mjs` / `npm run db:email-index`), NOT Prisma `@unique` — a plain unique index can't build over the ~1.5k anonymous `email: null` users (`E11000`). Query with `findFirst`. Unblocks `prisma db push`. (Deploy order: `db:email-index` → `db push`.)
- [x] `src/lib/auth.ts` — HMAC-signed session token, `sha256`, `randomToken`, cookie opts
- [x] `src/services/auth.ts` — `resolveSession`, `requireOwner(...)`, `setAnonSession`, verified sessions, magic links (+ endpoint merge)
- [x] Routes: `POST /api/auth/{session,magic-link,verify,logout}`
- [x] `requireOwner` enforced on **all** management routes (cross-user → 403)
- [x] `SessionProvider` + `ready`-gated client fetches (race-free)
- [x] `/auth/verify` page, `ClaimAccount` UI, Sign out
- [x] Fixed empty `AUTH_SECRET` (was 500-ing the session route)
- [x] Shared profile SWR cache — sidebar/header update live on profile edit
- [ ] Pre-expiry "export your webhooks" email (ties to B.3)
- [ ] OAuth 2.1 for MCP token-less connect (Phase 2, optional)

## B.3 — ZIP export
- [x] `POST /api/export` — owner-guarded streaming ZIP (`archiver` v8 `ZipArchive`, manifest + README + per-endpoint endpoint/forwarding + requests.{ndjson|json|csv}), redact toggle
- [x] `cursorRequests()` generator in the service layer (bounded keyset batches) + `listEndpointsForExport()`
- [x] Pure export helpers in `src/services/export.ts` (manifest/shape/CSV/filename) + tests
- [x] Export dialog UI: detail page (scope radio, **defaults to This endpoint**, **Pretty JSON** default, "Hide sensitive data" wording) + **dashboard "Export" with multi-select** (all endpoints checked by default, user can narrow)
- [x] Clear All now asks for confirmation (AlertDialog) before bulk-deleting requests
- [x] **Smoke-tested end-to-end** (dev): export → 200 `application/zip`, valid archive (README/manifest/per-endpoint files); sessionless export → 401
- [ ] `POST /api/jobs/export` — large exports → Vercel Blob → emailed link (deferred; free-tier streams inline)

## B.4 — Agent REST API ✅
- [x] `ApiToken` model (userId, name, tokenHash, prefix, scopes[], lastUsedAt, expiresAt) + User relation (cascade)
- [x] `GET /api/v1/endpoints`, `/api/v1/endpoints/:id/requests`, `/api/v1/requests/:id` — token-guarded, scoped, cursor-paginated
- [x] Token CRUD `GET/POST /api/tokens` + `DELETE /api/tokens/[id]` (raw `wcat_…` shown once)
- [x] `src/services/tokens.ts` + `requireToken(scope)` guard (`endpoints:read` / `requests:read`) + `lastUsedAt` audit
- [x] Settings → API tokens UI (create/name/revoke, scopes, `lastUsedAt`, prefix) + sidebar nav link
- [x] "Using your token" section (REST `curl` examples) + MCP "coming next phase" note (no dead link)
- [x] **Smoke-tested end-to-end** (dev, real token): valid token → 200 owner data; missing/bad → 401; **cross-user endpoint/request → 404 (isolation holds)**; `lastUsedAt` audit fires; create → 201 raw-once; list never leaks `tokenHash`

## B.5 — MCP server ✅
- [x] `src/app/api/mcp/route.ts` — `createMcpHandler` + `withMcpAuth` (`mcp-handler` 1.1 / `@modelcontextprotocol/sdk` 1.29), Node runtime, `maxDuration=300`, Streamable HTTP only (`disableSse`, fixed `streamableHttpEndpoint:"/api/mcp"` — no `[transport]` segment)
- [x] Tools: `list_endpoints`, `get_requests`, `get_request` — all delegate to `src/services/mcp.ts` (same service layer as REST + dashboard); `registerTool` API
- [x] `src/services/mcp.ts` — owner-scoped shaping: redaction (headers + body), body truncation in list output (`MAX_LIST_BODY_CHARS`, "call get_request for full body"), graceful tool errors (`{error}` → `isError`), `findEndpointIdForOwner` resolves id-or-name **scoped to userId**
- [x] `lastUsedAt` audit on each connect (`touchToken`); `requests:read` scope required via `withMcpAuth(required)`
- [x] Settings → "Connect an agent": real `claude mcp add` + generic JSON config snippets (replaced the "coming next phase" note)
- [x] **Smoke-tested end-to-end** (dev, real SDK client over Streamable HTTP): no token / `endpoints:read`-only → 401; tool discovery; `list_endpoints` (no `userId` leak); `get_requests` by name w/ redacted headers; `get_request` full + redacted body; **cross-user endpoint/request → tool error (isolation holds)**; missing id → graceful error
- [x] Unit tests — `src/services/mcp.test.ts` (redaction/truncation/isolation/auth-shape) + `findEndpointIdForOwner` ObjectId-guard tests (**74 tests** total)
- [ ] Per-token rate limit (deferred — gated on Upstash Redis being enabled; see B.0; REST routes share the same gap)
- [ ] (optional, Phase 2) OAuth 2.1 metadata route for token-less connect

## B.6 — Basic API Client (standalone) ✅
- [x] New `/dashboard/[userId]/api-client` section (arbitrary method/URL/headers/body → response) + sidebar nav link (Terminal icon)
- [x] **Server-side proxy** `POST /api/tools/http` — arbitrary URLs can't be fetched client-side (CORS) and we need response metadata; Node runtime, `maxDuration=30`
- [x] **SSRF guarded** (`src/services/http-proxy.ts`, pure + tested): http(s) only; blocks `localhost`/`.local`/`.internal` + private/loopback/link-local/CGNAT/metadata IP literals (v4 CIDRs + v6 ULA/link-local/mapped); **DNS-resolves the host and re-checks every resolved IP** (catches public hostname → private IP). `requireOwner` session-guarded (not an open proxy). Request timeout (15s) + capped response read (2 MB, flags `truncated`)
- [x] UI (`src/components/console/api-client.tsx`): method select, editable URL, header key/value rows, JSON body + beautify, **Send** → status (color-toned) + duration + size + content-type + collapsible response headers + pretty body; `@/lib/toast` for errors
- [x] **Minimal persistence (v1)** — single request, no save/history (per docs recommendation); reused the playground UX patterns, decoupled from the locked URL
- [x] Unit tests — `src/services/http-proxy.test.ts` (URL parse, hostname + address blocking, header shaping); **86 tests** total
- [x] **Smoke-tested end-to-end** (dev): no session → 401; cross-user → 403; literal SSRF (metadata/localhost/127.0.0.1) → 400; **DNS-rebind (`127.0.0.1.nip.io`) → 400**; bad scheme → 400; real `GET example.com` → 200 with full metadata
- Residual risk (documented): DNS-rebinding TOCTOU between our lookup and fetch's own resolution — acceptable for an authenticated free-tier tool

## B.7 — PWA / Installable app ✅
- [x] `public/site.webmanifest` (standalone, theme/bg, icon set)
- [x] `public/sw.js` — app-shell only, never caches `/api/*`
- [x] `ServiceWorkerRegister` (prod-only) + `InstallPrompt` mounted

## Cross-cutting
- [x] Vitest set up (`npm test`) — **91 tests** (redact, http, pagination, capture, endpoint update, ownership, auth crypto, avatar, export, api-token, MCP shaping/isolation, SSRF/proxy guard, ratelimit no-op + clientIp)
- [ ] Wire pagination UI ("load more") + server-side search on the detail page
- [ ] Startup env validation (fail fast if `AUTH_SECRET` missing/empty)
- [x] Rate limiting on the public webhook ingest (per-IP `ingest` bucket; see B.0) — enforced once `UPSTASH_REDIS_REST_URL`/`_TOKEN` are set
- [ ] E2E/runtime verification of the full auth cookie flow in a browser
