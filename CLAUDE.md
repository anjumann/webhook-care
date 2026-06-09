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
