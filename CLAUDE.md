# CLAUDE.md

Guidance for working in this repo. Read `docs/README.md` for the full product /
architecture / roadmap; this file is the day-to-day engineering contract.

## What this is

Webhook Catcher — a Next.js 15 (App Router) + React 19 app for catching,
inspecting, and forwarding webhooks. MongoDB via Prisma. Tailwind v4 + shadcn/ui.
Anonymous-first identity (ULID in `localStorage`), moving toward optional
magic-link claim. All-free product, 30-day retention. Source of truth for plans
is `docs/` (not the root `README.md`, which is the original aspirational PRD).

## Layout

- `src/app/**` — App Router pages + `api/*` route handlers.
- `src/services/**` — **all** Prisma access + business logic lives here. Routes,
  jobs, and the (planned) MCP/REST layers call services; they never touch Prisma
  directly. One query path = one source of truth for auth, pagination, filtering.
- `src/lib/**` — cross-cutting utilities: `prisma` (singleton), `error`
  (`parseError`), `http` (response helpers), `redact` (secret-header denylist),
  `ratelimit` (Upstash, when enabled).
- `src/endpoints/types.ts` — the single source for shared `Endpoint` / `Request`
  / `ForwardingUrl` shapes. Import from here; do not redefine them inline.
- `src/components/console/**` — the Emerald Console UI shell (current redesign).
- `prisma/schema.prisma` — MongoDB schema. The client is generated to
  `generated/prisma/` (git-ignored; produced by `postinstall`).

## Commands

- `npm run dev` — dev server (Turbopack).
- `npm run build` / `npm run start` — production build / serve.
- `npm run lint` — ESLint (next lint).
- `npm test` — run the Vitest unit suite once (CI mode).
- `npm run test:watch` — Vitest in watch mode.
- `npx prisma generate` — regenerate the client after editing the schema.
- `npx tsc --noEmit` — fast typecheck without a full build.
- `npm run db:ttl-index` — (re)create the Mongo TTL index on `Request.expiresAt`
  (Prisma can't express TTL for MongoDB; this is the retention safety net).

> **`npm install` needs `--legacy-peer-deps`** — there's a pre-existing
> `date-fns@4` vs `react-day-picker@8` peer conflict. A bare `npm install`
> errors `ERESOLVE`. Always `npm install <pkg> --legacy-peer-deps`.

After any schema edit: run `prisma generate`, then `tsc --noEmit`.

## Testing policy (REQUIRED)

**After you finish building a feature, add test cases for it and run them — when
testing applies.** A change isn't "done" until the relevant tests are written and
green. Treat this as part of the feature, not a follow-up.

- **What to test:** pure logic and business rules — redaction, name
  sanitization, pagination/cursor math, retention-window math, body parsing,
  auth/token resolution, Zod schemas. These have the highest bug-cost and are
  cheap to cover.
- **How:** Vitest. Co-locate as `*.test.ts` next to the unit, or under
  `src/**/__tests__/`. Mock `@/lib/prisma` with `vi.mock` — unit tests must NOT
  hit a real database or network. Keep tests fast and deterministic.
- **When it does NOT apply:** trivial/pure-presentational UI, generated code,
  one-line config. Use judgement — don't write hollow tests for coverage's sake.
- **Always run the suite (`npm test`) and the typecheck before declaring done.**
  If a test fails, fix the code or the test — never leave the suite red.

## Definition of done (every change)

A change is "done" only when all of these are green/updated:

1. `npx tsc --noEmit` clean, `npm test` green, **and `npm run build` passes**
   (the build also runs ESLint — an unused import will fail it).
2. New behaviour has unit tests for its pure logic (see Testing policy).
3. **Update `docs/PROGRESS.md`** — it tracks the `docs/04-implementation-plan.md`
   build plan. Tick the boxes you completed and add brief notes. `docs/` is the
   source of truth for plans; keep it in sync with reality.
4. Schema changed? `prisma generate` ran, and any Mongo-only concern (TTL,
   indexes Prisma can't model) is handled via a `scripts/*` step + documented.

## Verifying against the real app/DB (smoke tests)

Unit tests mock Prisma; for an end-to-end check, run `npm run dev` and exercise
the routes. The dev server may bind to **:3001** if :3000 is taken — check the
log. To mint auth locally without the full browser flow (DB access via the
`DATABASE_URL` in `.env`):

- **Verified session cookie:** insert a `Session` row with
  `tokenHash = sha256(raw)`, then send `Cookie: wcat_session=s:<raw>`.
- **API token (PAT):** insert an `ApiToken` with `tokenHash = sha256(raw)` where
  `raw` starts with `wcat_`, then send `Authorization: Bearer <raw>`.

Always assert **tenant isolation** (another user's id → 404, not their data) and
**clean up** any rows you insert. Don't point smoke tests at prod.

## Performance & best coding practices (REQUIRED for every change)

Treat these as acceptance criteria, not aspirations. Apply them as you write, not
as a cleanup pass.

**Performance**
- **Never load unbounded result sets.** Every list query takes a `take`/`limit`
  and uses cursor pagination (`createdAt` + `_id`). The `Request` table grows
  without bound — assume an endpoint has 100k requests and write the query that
  survives it. No `findMany` without a bound.
- **Select only the fields you use** (`select`/`projection`). Don't `include`
  whole relations (especially `requests`) when a count or a page will do.
- **Keep the webhook ingest hot path lean.** It is the highest-traffic code path:
  minimal awaited work, one transaction for the write + counter, forwarding stays
  fire-and-forget (not awaited). Don't add blocking calls to it.
- **Server-side filtering/search**, never client-side over a fully-loaded set.
- **Index every field you filter or sort on** (`@@index`). Retention sweeps rely
  on the `expiresAt` index; keep it.
- **Don't refetch what SWR already caches** — mutate keys, don't full-reload.
- Prefer Server Components for data reads; push client JS down the tree.

**Correctness & security**
- **Authorize every management route.** Reads/writes to stored data must prove
  ownership (session cookie / token), never trust a `userId` from the URL or
  query. The public webhook ingest is the only intentionally-open write path.
  Use the existing guards — don't hand-roll auth:
  - **Dashboard / management routes** → `requireOwner(userId)` /
    `requireOwnerOfEndpoint(id)` / `requireOwnerOfRequest(id)` from
    `@/services/auth` (session cookie: stateless anon, or `s:`-prefixed verified).
  - **Agent REST (`/api/v1/*`) + MCP** → `requireToken(req, scope)` from
    `@/lib/api-token` (bearer PAT → `userId` + scopes; read-only scopes only).
  - **Jobs (`/api/jobs/*`)** → verify the QStash signature; never publicly callable.
- **Redact secrets at write time** via `lib/redact` (auth headers, signatures,
  cookies, API keys) before persisting or returning payloads.
- **Validate all external input with Zod** at the boundary (route handlers,
  actions). Parse, don't assume.
- **Guard every `JSON.parse`** (and any throwing parse) — never in a `useState`
  initializer or unguarded in a hot path.
- Webhook capture must **never silently drop a body** — store the raw text for
  unknown content-types in addition to a parsed view when possible.

**Code quality**
- Routes stay thin: validate → call a service → shape the response. Logic in
  services, reused across REST/MCP/dashboard.
- Use `lib/http` response helpers and `parseError` for consistent API errors;
  don't hand-roll `NextResponse.json({error})` shapes per route.
- Match surrounding style; reuse existing components and the `@/lib/toast`
  adapter (one toast system — no `sonner`/`react-hot-toast` direct imports).
- New shared types go in `types.ts`, imported everywhere — no drift copies.
- Prefer small, composable, pure functions; keep side effects at the edges.

## Gotchas

- Identity key is `User.userId` (the ULID), **not** the Mongo `_id`. Relations
  and webhook URLs use `userId`.
- `params` is a Promise in Next 15 route handlers/pages — `await` it.
- Don't commit `generated/prisma/` (git-ignored; regenerated on install/build).
- Forwarding is intentionally fire-and-forget on the free plan — do not "fix" it
  into an awaited/durable path without a product decision (see `docs/02` §1.1#6).
- **Retention is driven by `Request.expiresAt`.** Pinning a request **nulls**
  `expiresAt` (and unpinning recomputes it) so pinned rows are exempt from both
  the nightly sweep and the Mongo TTL index. Keep that invariant if you touch pin
  logic. The QStash retention job supports a dry run (`RETENTION_DRY_RUN=true` or
  `?dryRun=true`); its schedule needs a **public `APP_URL`** (QStash can't call
  `localhost`).
- **`archiver` v8 is pure ESM** — there's no default `archiver("zip")` factory;
  use `new ZipArchive({ … })` (named export). Stream it to the response via
  `Readable.toWeb(...)`; never buffer a whole export in memory.
- **Mongo TTL / index drift:** Prisma doesn't model TTL indexes for MongoDB, and
  Mongo rejects two indexes with the same key. The TTL script reuses the existing
  `Request_expiresAt_idx` name so Prisma stays satisfied. Known quirk: the dev
  `Session` collection carries a stale unique index — see the
  `session-legacy-index` memory before debugging verified-login `P2002`s.
- **Never query a Mongo `@db.ObjectId` field (`id`) with an arbitrary string** —
  Prisma throws `Malformed ObjectID`. When resolving "id-or-name", gate the id
  branch behind `/^[a-f0-9]{24}$/i` (see `findEndpointIdForOwner`) or query name
  and id separately; don't `OR` a raw string across both.
- **Rate limiting (`@/lib/ratelimit`) is no-op + fail-open by design.** With no
  `UPSTASH_REDIS_REST_URL`/`_TOKEN` it allows everything (so dev + free tier work
  without Redis); a Redis error also **allows** (never drop legit traffic on an
  infra hiccup). Keep both. Use the named buckets via `rateLimit(name, key)` and
  return `tooManyRequests()` on `!success` — don't hand-roll a limiter or hard-fail
  closed. It's wired into ingest (per IP), magic-link (per IP + email), export +
  api-client (per user), and `requireToken` + the MCP auth callback (per token).
  Enforcement only kicks in once the Upstash env vars are set (a deploy-time op).
- **The API client proxy (`POST /api/tools/http`) fetches arbitrary URLs — it's
  an SSRF surface.** Keep all four guards if you touch it: `requireOwner`
  (not an open proxy), http(s)-only + blocked hostnames, **DNS-resolve and
  re-check every resolved IP** against private ranges (`src/services/http-proxy.ts`),
  and a request timeout + capped response read. Never relax these to "just
  proxy it." The pure guards are unit-tested; smoke-test rebinding with a
  `*.nip.io` host (resolves to 127.0.0.1).
- **MCP server (`/api/mcp`)** uses `mcp-handler` + `@modelcontextprotocol/sdk`.
  It's a **static** route (`src/app/api/mcp/route.ts`) with a fixed
  `streamableHttpEndpoint:"/api/mcp"` and `disableSse` — no `[transport]`
  dynamic segment (a catch-all at `/api/` would collide with the other routes).
  Tools delegate to `src/services/mcp.ts`; auth reuses `resolveToken` so revoking
  a PAT kills MCP too. If `tsc` reports **"Type instantiation is excessively
  deep"** on `registerTool`, it's a **zod version skew** — keep root `zod`
  aligned with what `@modelcontextprotocol/sdk`/`zod-to-json-schema` expect
  (currently `^3.25.76`). Smoke-test with the SDK's `StreamableHTTPClientTransport`
  (Bearer header via `requestInit`), not raw curl.
