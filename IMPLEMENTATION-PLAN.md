# Webhook Catcher — MCP Server Design & Implementation Plan

> The build companion to `IMPROVEMENTS.md` (audit + roadmap) and
> `FEATURES-DESIGN.md` (feature rationale). This document does two things:
>
> 1. **§A — A full, standalone design for the MCP server** so a user's AI agent
>    can connect and fetch (and optionally search) their webhook data.
> 2. **§B — A complete, checkbox-style implementation plan** ("what we need to
>    build") for every confirmed workstream: retention, magic-link identity,
>    ZIP export, the agent REST API, and the MCP server — with packages, env
>    vars, schema migrations, and the files to create/modify.

---

# Part A — MCP Server Design

## A.1 What we're building & why

**MCP (Model Context Protocol)** is an open standard for connecting AI agents to
external systems through typed **tools**. Instead of a user writing glue code,
they paste our server URL + a token into their agent (Claude, Cursor, etc.) and
the agent can immediately call tools like `get_requests`. For Webhook Catcher this
means: *"my AI agent watches my webhook endpoint and tells me what's arriving"* —
with zero custom integration.

We expose a **remote MCP server** that is read-only, scoped per user via a
Personal Access Token (PAT), and backed by the same service layer as our REST
API (one source of truth for auth, pagination, filtering).

## A.2 Transport & hosting

| Decision | Choice | Why |
|----------|--------|-----|
| Transport | **Streamable HTTP** (remote) | Current MCP remote transport; works with hosted agents. (Legacy SSE transport is optional/deprecated — only add if a target client needs it.) |
| Host | **Next.js route handler at `/api/mcp`** on Vercel **Fluid Compute** (Node runtime) | Same app/deploy; full Node; no separate service. |
| Adapter | **`mcp-handler`** (Next.js wrapper, formerly `@vercel/mcp-adapter`) over **`@modelcontextprotocol/sdk`** | Handles the MCP protocol/transport so we just declare tools. *Verify the latest package + API at build time — MCP tooling moves fast.* |
| Function config | `runtime = "nodejs"`, raise `maxDuration` (e.g. 300s) | Tool calls + streaming need full Node and headroom. |
| State (only if SSE enabled) | **Upstash Redis** | The adapter can use Redis to coordinate SSE sessions; not needed for pure Streamable HTTP. |

## A.3 Authentication

Two layers, pick the rollout you want:

1. **Bearer PAT (ship first — simplest).** The agent sends
   `Authorization: Bearer wcat_…`. We hash → look up `ApiToken` → check
   `requests:read` scope + expiry → resolve `userId`. Every tool call runs in
   that user's scope. Wrap the handler with the adapter's auth helper
   (`withMcpAuth`) so unauthenticated/over-scoped calls are rejected before any
   tool runs.

2. **OAuth 2.1 (optional, nicer UX later).** MCP supports OAuth so clients show a
   "Connect / Authorize" button instead of pasting a token. We'd add the
   protected-resource metadata route
   (`/.well-known/oauth-protected-resource`) and an authorization server (or
   delegate to our magic-link session). Recommended as a Phase-2 enhancement;
   bearer PAT is enough to launch.

> Auth reuses the exact `ApiToken` model and hash-lookup from
> `FEATURES-DESIGN.md` §3.1, so revoking a token in Settings instantly kills both
> REST and MCP access.

## A.4 Tools (the agent-facing API)

All read-only, all scoped to the token's `userId`, all cursor-paginated where a
list is returned.

### `list_endpoints`
- **Input:** none.
- **Returns:** array of `{ id, name, description, status, requestCount, lastActivity }`.
- **Use:** agent discovers what endpoints exist before fetching.

### `get_requests`
- **Input:**
  | field | type | notes |
  |-------|------|-------|
  | `endpoint` | string (required) | endpoint id or name |
  | `limit` | number (1–100, default 25) | page size |
  | `cursor` | string (optional) | opaque pagination cursor |
  | `method` | string (optional) | filter (GET/POST/…) |
  | `status` | number (optional) | filter by status code |
  | `since` | ISO datetime (optional) | only newer than |
- **Returns:** `{ items: Request[], nextCursor: string | null }`.
- **Use:** the core "fetch my webhooks" tool. Filters cover most agent needs
  ("last 20 failed POSTs") without full-text search.

### `get_request`
- **Input:** `{ requestId: string }`.
- **Returns:** full request — `method, headers, query, body, statusCode, response, duration, createdAt`.
- **Use:** drill into one payload (e.g. "why did this signature fail?").

### `search_requests` *(optional — Phase 2)*
- **Input:** `{ endpoint: string, query: string, limit?, cursor? }`.
- **Returns:** matching requests.
- **Note:** requires a real search index (Atlas Search or a normalized text
  field). Per the product call, **fetch is the MVP; search is optional.**

> **Tool-output hygiene:** cap payload sizes returned to the agent (truncate huge
> bodies with a note + `get_request` for full content), and always redact the
> secret-header denylist (`IMPROVEMENTS.md` §3.4) so tokens never reach the model.

## A.5 Reference implementation sketch

```ts
// src/app/api/mcp/route.ts
import { createMcpHandler, withMcpAuth } from "mcp-handler"; // verify latest API
import { z } from "zod";
import * as svc from "@/services/requests";        // shared with REST + dashboard
import { resolveToken } from "@/lib/api-token";     // sha256 lookup → { userId, scopes }
import { mcpRateLimit } from "@/lib/ratelimit";     // Upstash per-token

export const runtime = "nodejs";
export const maxDuration = 300;

const handler = createMcpHandler((server) => {
  server.tool(
    "list_endpoints",
    "List the caller's webhook endpoints.",
    {},
    async (_args, { authInfo }) => text(await svc.listEndpoints(authInfo.userId)),
  );

  server.tool(
    "get_requests",
    "Fetch captured webhook requests for an endpoint (paginated, filterable).",
    {
      endpoint: z.string(),
      limit: z.number().int().min(1).max(100).default(25),
      cursor: z.string().optional(),
      method: z.string().optional(),
      status: z.number().int().optional(),
      since: z.string().datetime().optional(),
    },
    async (args, { authInfo }) => text(await svc.getRequests(authInfo.userId, args)),
  );

  server.tool(
    "get_request",
    "Fetch a single captured request in full.",
    { requestId: z.string() },
    async ({ requestId }, { authInfo }) =>
      text(await svc.getRequest(authInfo.userId, requestId)),
  );
});

// Verify bearer PAT, attach { userId, scopes }, rate-limit, then run tools.
const authed = withMcpAuth(handler, async (req, bearer) => {
  const token = await resolveToken(bearer);                 // null if invalid
  if (!token || !token.scopes.includes("requests:read")) return undefined;
  const { success } = await mcpRateLimit.limit(token.id);
  if (!success) throw new Response("rate limited", { status: 429 });
  return { token: bearer, userId: token.userId, scopes: token.scopes };
});

export { authed as GET, authed as POST };

// helper: MCP tools return a content array
const text = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
});
```

Notes:
- **One service layer** (`svc.*`) backs MCP, REST, and the dashboard — never
  duplicate query logic.
- **Errors** become MCP tool errors (e.g. return `{ isError: true, content: […] }`
  for "endpoint not found") so the agent can react gracefully.

## A.6 How a user connects their agent

Provide copy-paste snippets in the Settings → "Connect an agent" UI.

**Claude Code / Claude Desktop (remote MCP, bearer):**
```bash
claude mcp add --transport http webhook-catcher https://APP/api/mcp \
  --header "Authorization: Bearer wcat_xxx"
```

**Generic MCP client config (JSON):**
```json
{
  "mcpServers": {
    "webhook-catcher": {
      "url": "https://APP/api/mcp",
      "headers": { "Authorization": "Bearer wcat_xxx" }
    }
  }
}
```

(If we later add OAuth, clients can connect by URL alone and authorize in the
browser — no pasted token.)

## A.7 Testing & validation

- **MCP Inspector** (`npx @modelcontextprotocol/inspector`) → point at
  `https://APP/api/mcp` with a test token; verify tool discovery, inputs, and
  responses interactively.
- **Unit tests** on the service layer (`svc.getRequests` filters/pagination/scope
  isolation — a token must never read another `userId`).
- **Auth tests:** missing token → rejected; wrong scope → rejected; revoked token
  → rejected; rate limit → 429.
- **End-to-end:** connect a real agent, run `list_endpoints` → `get_requests`.

## A.8 Security recap

- Read-only scopes only (`endpoints:read`, `requests:read`); no delete/replay.
- Strict per-`userId` scoping on every query (multi-tenant isolation).
- Per-token rate limiting + `lastUsedAt` audit; instant revoke from Settings.
- Redact secret headers in tool output; cap response sizes.

---

# Part B — What We Need to Implement

Grouped by workstream and ordered for delivery. Each item is a concrete unit of
work. (Phases mirror `IMPROVEMENTS.md` §8 and `FEATURES-DESIGN.md` §6.)

## B.0 Shared foundations (do these first — everything depends on them)

**Packages**
- [ ] `@upstash/redis`, `@upstash/ratelimit` — rate limiting, cache, counters
- [ ] `@upstash/qstash` — durable jobs + retention schedule
- [ ] `archiver` (+ types) — streaming ZIP export
- [ ] `mcp-handler` + `@modelcontextprotocol/sdk` — MCP server
- [ ] `@vercel/blob` — private storage for large async exports
- [ ] (already present) `resend`, `zod`, `ulid`, `@prisma/client`

**Env vars** (add to `.env` + Vercel project)
- [ ] `AUTH_SECRET` — sign/verify session cookies
- [ ] `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- [ ] `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`
- [ ] `BLOB_READ_WRITE_TOKEN`
- [ ] `APP_URL` — absolute base for emails + job/MCP callbacks
- [ ] (exists) `DATABASE_URL`, `NEXT_PUBLIC_RESEND_KEY`

**Cross-cutting refactors**
- [ ] **Service layer** `src/services/{endpoints,requests,users,export}.ts` —
  move all Prisma + business logic here; routes/MCP/dashboard call these.
- [ ] **Auth guards** `src/lib/auth.ts` → `requireOwner(req, userId)` (session
  cookie) and `src/lib/api-token.ts` → `resolveToken(bearer)` (PAT hash lookup).
- [ ] **Rate limiters** `src/lib/ratelimit.ts` — ingest, magic-link, token, export.
- [ ] **Redaction** `src/lib/redact.ts` — secret-header denylist used by export,
  REST, and MCP.
- [ ] **Prisma hygiene:** stop committing `generated/prisma/`; add to
  `.gitignore`; run `prisma generate` in `postinstall`.
- [ ] **Fix known bugs** (`IMPROVEMENTS.md` §1.1 #9): avatar double-prefix in
  `useUser`, trailing spaces in `getProfile` URL, unguarded `JSON.parse` in the
  playground, empty `endpoints/types.ts`.

## B.1 Retention (30-day auto-delete) — `IMPROVEMENTS.md` §6

**Schema**
- [ ] `Request.pinned Boolean @default(false)`
- [ ] `Request.expiresAt DateTime` + `@@index([expiresAt])`
- [ ] `Endpoint.retentionDays Int @default(30)`
- [ ] (optional safety net) Mongo TTL index on `expiresAt`

**Code** *(free-tier shape — single batched job, NOT per-endpoint fan-out; see
`IMPROVEMENTS.md` §6.3 callout re: QStash 1,000 msg/day limit)*
- [ ] Webhook handler sets `expiresAt = now + retentionDays` on capture
- [ ] `POST /api/jobs/retention` — QStash-signed; **one job** that loops bounded
  `deleteMany` (e.g. 1–5k/pass) over expired, **unpinned** requests until done
- [ ] QStash **Schedule** `0 0 * * *` (midnight, UTC) → `/api/jobs/retention`
  (≈1 QStash message/day — stays inside the free tier)
- [ ] Mongo **TTL index** on `expiresAt` as the real safety net
- [ ] Dry-run flag/env for a few nights before enabling real deletes
- [ ] *(scale-up only, post-free-tier)* per-endpoint fan-out + `/purge` + DLQ

**UI**
- [ ] Per-request "expires in N days" chip; pinned → "kept"
- [ ] Pin/unpin action in the request list
- [ ] Per-endpoint retention selector (24h / 7d / 30d)

## B.2 Magic-link identity — `FEATURES-DESIGN.md` §1

**Schema**
- [ ] `User.email String? @unique`, `User.emailVerifiedAt DateTime?`
- [ ] `MagicLink` model (email, tokenHash, userId, expiresAt, consumedAt)
- [ ] `Session` model (userId, tokenHash, expiresAt, userAgent)

**Routes**
- [ ] `POST /api/auth/magic-link` — rate-limited; create token; email via Resend;
  uniform 200 response
- [ ] `POST /api/auth/verify` — validate (single-use, expiry, constant-time);
  set `email`/`emailVerifiedAt`; create session cookie; handle **merge**
- [ ] `POST /api/auth/logout` — revoke session
- [ ] Retrofit `requireOwner` onto **all** existing management routes
  (`/api/endpoints*`, `/api/requests*`, `/api/user*`)

**UI**
- [ ] "Save / claim your dashboard" entry point + email input
- [ ] `/auth/verify` landing page
- [ ] Merge prompt ("move this browser's N endpoints into your account?")
- [ ] Pre-expiry "export your webhooks" email (ties to B.3)

## B.3 ZIP export — `FEATURES-DESIGN.md` §2

**Routes**
- [ ] `POST /api/export` — owner-guarded; **streams** a ZIP (manifest +
  per-endpoint `endpoint.json` / `forwarding.json` / `requests.ndjson`);
  cursor-batches requests; redaction option
- [ ] `POST /api/jobs/export` — QStash job for **large** exports → write ZIP to
  private Vercel Blob → email signed download link
- [ ] `cursorRequests(endpointId, range)` generator in the service layer

**UI**
- [ ] Export dialog: scope (all / selected / this endpoint), date range,
  include headers/body, redact toggle, format (NDJSON / JSON / CSV summary)
- [ ] "Preparing your export, we'll email a link" state for async

## B.4 Agent REST API — `FEATURES-DESIGN.md` §3

**Schema**
- [ ] `ApiToken` model (userId, name, tokenHash, prefix, scopes[], lastUsedAt, expiresAt)

**Routes (versioned, read-only, token-guarded, cursor-paginated)**
- [ ] `GET /api/v1/endpoints`
- [ ] `GET /api/v1/endpoints/:id/requests` (filters: method/status/since/cursor/limit)
- [ ] `GET /api/v1/requests/:id`
- [ ] (optional) `GET /api/v1/endpoints/:id/requests/search`
- [ ] Token CRUD: `POST/GET/DELETE /api/tokens` (create shows raw once)

**UI**
- [ ] Settings → API tokens: create/name/revoke, show `lastUsedAt`, prefix only

## B.5 MCP server — Part A above

- [ ] `src/app/api/mcp/route.ts` — `createMcpHandler` + `withMcpAuth`, Node
  runtime, raised `maxDuration`
- [ ] Tools: `list_endpoints`, `get_requests`, `get_request` (+ optional
  `search_requests`) — all delegating to `src/services/*`
- [ ] Per-token rate limit + `lastUsedAt` update on each call
- [ ] Truncate/redact tool output
- [ ] Settings → "Connect an agent": copy-paste config snippets (A.6)
- [ ] Validate with MCP Inspector + auth/scope/isolation tests
- [ ] (optional, Phase 2) OAuth 2.1 metadata route for token-less connect

## B.6 Basic API Client (standalone) — *separate from the endpoint playground*

> The existing **Webhook Playground** stays exactly as-is — it is correctly
> scoped to test a single endpoint's locked URL. This is a **new, separate
> section**: a minimal API client so users can make basic API calls **without
> leaving the platform**. Deliberately **not** Postman-level.

**Scope (v1 = minimal)**
- [ ] New top-level section/route, e.g. `/dashboard/[userId]/api-client`
- [ ] Editable **method + URL** (arbitrary URL — the key difference vs. the playground)
- [ ] Headers (key/value rows), JSON body editor + beautify, query params (nice-to-have)
- [ ] **Send** → show response (status, time, size, headers, pretty body)
- [ ] Reuse the `WebhookTestSection` UI as the base; decouple the read-only URL

**Decision to confirm:** persistence in v1?
- [ ] **Minimal (recommended):** single request, no save/history — ship fast
- [ ] **Saved requests + history:** add only if v1 shows demand

**Risk to manage:** scope creep toward a Postman clone. Frame as *"quick API
calls without leaving Webhook Catcher,"* not a general API platform.

## B.7 PWA / Installable app

> Mostly low-effort — `public/site.webmanifest` + icons already exist.

- [ ] Verify/expand `site.webmanifest` (name, theme/background color, `display:
  standalone`, icon set already present in `/public`)
- [ ] Add a **service worker** (offline app shell; cache static assets) — e.g.
  via `next-pwa`/Serwist or a hand-rolled SW
- [ ] **Install prompt** UX (capture `beforeinstallprompt`, "Install app" button)
- [ ] Test installability (Lighthouse PWA audit) on desktop + mobile
- [ ] Decide offline scope: **app shell only** (recommended) vs. caching webhook
  data (data is live + per-user, so keep it shell-only)

## B.8 Suggested order

```
1. B.0 foundations  →  2. B.2 identity/guards  →  3. B.1 retention
4. B.3 export (sync) →  5. B.4 token API        →  6. B.5 MCP server
7. B.6 API client    →  8. B.7 PWA
9. (optional) async export, search, OAuth for MCP, API-client save/history
```

Identity/guards land early because retention, export, and tokens all assume a
verified owner. The MCP server is a thin protocol layer over the service code
built in B.0–B.4. **B.6 (API client)** and **B.7 (PWA)** are independent,
low-risk quick wins that can be slotted in any time — good candidates for an
early morale/usage boost.

---

## C. Definition of Done (per feature)

- **Retention:** a request older than its endpoint's window is gone after the
  next midnight run; pinned requests survive; dry-run verified; metrics emitted.
- **Identity:** a user can claim via email, log in on a second device, see the
  same data, and revoke sessions; every management route rejects non-owners.
- **Export:** a user downloads a ZIP of all (or selected) endpoints with
  requests as NDJSON; large exports arrive by emailed link; secrets redacted.
- **Agent API:** a read-only token fetches endpoints/requests, scoped to its
  owner, rate-limited, revocable.
- **MCP:** an AI agent connects with a token and successfully calls
  `list_endpoints` → `get_requests` → `get_request`; cannot see other users' data
  or perform writes.
- **API Client:** a user makes an arbitrary method/URL/headers/body request from
  a dedicated section and sees the full response — without leaving the platform.
- **PWA:** the app passes the Lighthouse PWA audit and can be installed
  (standalone window, app icon) on desktop and mobile.
