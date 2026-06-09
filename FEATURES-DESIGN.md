# Webhook Catcher — Detailed Design: Identity, Export & Agent Access

> Companion to `IMPROVEMENTS.md`. This document is the implementation-ready
> design for three **confirmed** features and how they interlock:
>
> 1. **Email / Magic-link identity** — optional, recoverable, cross-device login
>    on top of the anonymous-first model.
> 2. **ZIP export** — let a user collect all their webhooks (per endpoint /
>    per section) into a single downloadable archive.
> 3. **Agent / AI access** — a token-secured API **and** an MCP server so a
>    user's bot or AI agent can connect and *fetch* (and optionally *search*)
>    webhook data.
>
> These are sequenced deliberately: **identity is the gate**. Both export and
> agent access expose a user's full dataset, so they must sit behind a verified,
> ownership-proving session — which the magic-link flow provides.

---

## 0. Why these three belong together

```
            ┌────────────────────────────────────────────┐
            │  Magic-link identity (the trust anchor)     │
            │  • proves "this caller owns userId X"        │
            │  • issues signed session cookie + API tokens │
            └───────────────┬───────────────┬─────────────┘
                            │               │
              owner-only    │               │   token-scoped (read-only)
              browser action│               │   programmatic access
                            ▼               ▼
                  ┌──────────────────┐  ┌──────────────────────────┐
                  │  ZIP Export      │  │  Agent API + MCP server  │
                  │  (download all)  │  │  (fetch / search)        │
                  └──────────────────┘  └──────────────────────────┘
```

Without identity, export and agent access would leak data (today any `userId`
is guessable — see `IMPROVEMENTS.md` §1.1). With it, every privileged path has a
provable owner.

---

## 1. Feature A — Email / Magic-Link Identity

### 1.1 Principles

- **Anonymous-first stays.** A new visitor still gets a ULID and a working
  dashboard with zero friction. Nothing here forces sign-up.
- **Claiming is opt-in and reversible.** "Save your dashboard" → enter email →
  click link → your existing anonymous data is now recoverable and reachable from
  any device.
- **Passwordless.** No password storage. The email *is* the credential, proven by
  a single-use, short-lived magic link.

### 1.2 Data model

```prisma
model User {
  // … existing fields …
  email           String?   @unique          // null = still anonymous
  emailVerifiedAt DateTime?
}

model MagicLink {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  email      String
  tokenHash  String   @unique               // sha256(token); never store raw
  userId     String                          // the ULID being claimed/linked
  expiresAt  DateTime                         // now + 15 min
  consumedAt DateTime?                        // single-use guard
  createdAt  DateTime @default(now())

  @@index([email])
  @@index([expiresAt])
}

model Session {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  userId     String                          // ULID
  tokenHash  String   @unique               // sha256 of the session secret
  userAgent  String?
  expiresAt  DateTime                         // e.g. now + 30 days, sliding
  createdAt  DateTime @default(now())

  @@index([userId])
}
```

> Sessions can alternatively be **stateless signed JWTs** in an HttpOnly cookie.
> A `Session` table is preferred because it allows server-side revocation ("log
> out everywhere"), which matters once tokens and exports exist.

### 1.3 Flow

```
1. POST /api/auth/magic-link    { email }
   • rate-limited (Upstash) per email + per IP
   • token = randomBytes(32) → store sha256(token), expiresAt = now+15m,
     userId = current anonymous ULID (from cookie)
   • email link: https://APP/auth/verify?token=<raw>   (Resend)
   • ALWAYS respond 200 "check your email" (never reveal if email exists)

2. GET /auth/verify?token=…  →  POST /api/auth/verify  { token }
   • hash incoming token, look up MagicLink by tokenHash (constant-time)
   • reject if missing / expired / already consumed
   • mark consumedAt; set User.email + emailVerifiedAt
   • MERGE: if that email already had a different ULID, link/merge datasets
     (see §1.4)
   • create Session, set HttpOnly, Secure, SameSite=Lax cookie
   • redirect to /dashboard/{userId}
```

### 1.4 Cross-device & the merge problem

When someone claims `alice@example.com` from a second browser that already minted
its *own* anonymous ULID, you have two ULIDs for one human. Options:

- **Adopt (recommended default):** the email "owns" one canonical `userId`. On
  verify, point the session at the canonical ULID; offer to **import** the
  current browser's anonymous endpoints into it (re-parent `Endpoint.userId`).
- **Keep separate:** simplest, but confusing. Avoid.

Make the merge explicit in the UI ("We found an existing account for this email.
Move this browser's 2 endpoints into it?").

### 1.5 Security checklist

- Single-use tokens, 15-minute TTL, `sha256` at rest, constant-time compare.
- Rate-limit magic-link requests (Upstash `@upstash/ratelimit`) — per email and
  per IP — to stop enumeration/spam.
- Uniform "check your email" response regardless of account existence.
- Cookies: `HttpOnly`, `Secure`, `SameSite=Lax`, signed; sliding 30-day session
  with server-side revocation via the `Session` table.
- All `/api/endpoints`, `/api/requests`, `/api/user`, `/api/export`, and token
  management routes call a shared `requireOwner(req, userId)` guard.

### 1.6 Retention tie-in

- **Anonymous users:** 30-day retention as designed in `IMPROVEMENTS.md` §6.
- **Claimed (email) users:** can receive a pre-expiry **"your webhooks expire in
  3 days — export them"** email (Resend), with a one-click link to the ZIP export
  (Feature B). This turns retention from a silent delete into a helpful nudge and
  a reason to claim an account.

---

## 2. Feature B — ZIP Export ("Webhook Archive")

### 2.1 Goal

Let a user gather everything in one place: export **all** endpoints, a **selected
set**, or a **single** endpoint into one ZIP — organized so it's browsable
offline and re-importable later.

### 2.2 Archive layout

```
webhook-catcher-export-2026-06-09.zip
├── manifest.json                     # who/when/scope/counts/schema version
├── README.txt                        # human description of the structure
└── endpoints/
    ├── my-stripe-hook/
    │   ├── endpoint.json              # name, description, status, retentionDays
    │   ├── forwarding.json            # configured forwarding URLs
    │   └── requests.ndjson            # one captured request per line (streamable)
    └── github-events/
        ├── endpoint.json
        ├── forwarding.json
        └── requests.ndjson
```

- **NDJSON for requests** (one JSON object per line) so the writer can **stream**
  request-by-request and the reader can process huge logs without loading the
  whole file. A `requests.json` array is offered as an option for small exports.
- `manifest.json` carries a `schemaVersion` so a future **import** feature can
  evolve safely.

### 2.3 Scope & options (UI)

- **Scope:** All endpoints · Selected endpoints · This endpoint.
- **Date range:** optional (default: everything still retained).
- **Include:** headers ✅, body ✅, redact-secrets toggle (reuses the redaction
  list from `IMPROVEMENTS.md` §3.4), forwarding config ✅.
- **Format:** NDJSON (default) · pretty JSON · CSV summary (method/status/time
  table) for spreadsheet users.

### 2.4 Implementation — synchronous (small) vs. async (large)

**Small exports (default, e.g. < ~50 MB / < N requests): stream the ZIP inline.**

```ts
// src/app/api/export/route.ts   (owner-guarded)
import archiver from "archiver";        // streaming zip
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { userId } = await requireOwner(req);          // §1.5
  const { endpointIds, range, redact } = await req.json();

  const archive = archiver("zip", { zlib: { level: 9 } });
  const stream = archiveToWebStream(archive);          // adapter to a ReadableStream

  // manifest + per-endpoint files
  (async () => {
    const endpoints = await prisma.endpoint.findMany({
      where: { userId, ...(endpointIds && { id: { in: endpointIds } }) },
      include: { forwardingUrls: true },
    });
    archive.append(JSON.stringify(buildManifest(endpoints), null, 2), { name: "manifest.json" });

    for (const ep of endpoints) {
      const base = `endpoints/${ep.name}`;
      archive.append(JSON.stringify(ep, null, 2), { name: `${base}/endpoint.json` });
      archive.append(JSON.stringify(ep.forwardingUrls, null, 2), { name: `${base}/forwarding.json` });

      // STREAM requests in cursor batches → NDJSON, never load all at once
      const ndjson = new PassThrough();
      archive.append(ndjson, { name: `${base}/requests.ndjson` });
      for await (const batch of cursorRequests(ep.id, range)) {
        for (const r of batch) ndjson.write(JSON.stringify(redact ? redactRequest(r) : r) + "\n");
      }
      ndjson.end();
    }
    archive.finalize();
  })();

  return new Response(stream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="webhook-catcher-export-${today()}.zip"`,
    },
  });
}
```

Key points: **cursor-paginate** requests (`cursorRequests` yields batches by
`_id`/`createdAt`) and **pipe into the archive** so memory stays flat regardless
of dataset size.

**Large exports: hand off to a background job (Upstash QStash).**

```
POST /api/export  (large) → enqueue QStash job → /api/jobs/export
   • job streams the ZIP to object storage (Vercel Blob, private)
   • on completion, email the user a signed, short-lived download URL (Resend)
   • UI shows "we're preparing your export; we'll email you a link"
```

This reuses the same Upstash + Resend infrastructure already in the plan and
avoids function-timeout/memory limits on huge archives.

### 2.5 Security

- Owner-guarded; an export contains everything, so ownership must be proven.
- Background download links are **signed and expiring**; stored in **private**
  Blob storage.
- Honor the **redact-secrets** option so shared exports don't leak tokens.

### 2.6 Bonus: this is also your import / backup story

Because the archive is self-describing (`manifest.schemaVersion`), a later
**import** feature can rehydrate endpoints + requests from a ZIP — completing the
"collect everything in one place, take it with you" loop and serving as the
pre-deletion backup for retention (§1.6).

---

## 3. Feature C — Agent / AI Access (Fetch + optional Search)

The ask: *let a user's bot/AI agent connect to our server and fetch (and
optionally search) whatever it wants.* We deliver this **two ways from one core**
so it works for any agent stack:

1. **Personal Access Token (PAT) REST API** — universal; any HTTP-capable agent.
2. **MCP server** — the agent-native protocol; an AI agent (Claude, etc.)
   "connects" and calls typed tools. This is the modern, ergonomic path the
   request describes.

Both are **read-only** and share one service layer + one auth model.

### 3.1 Tokens

```prisma
model ApiToken {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  userId     String                          // owner ULID
  name       String                           // "Claude agent", "CI bot"
  tokenHash  String   @unique               // sha256(token); raw shown ONCE
  prefix     String                           // e.g. "wcat_a1b2" for UI display
  scopes     String[]                         // ["endpoints:read","requests:read"]
  lastUsedAt DateTime?
  expiresAt  DateTime?                         // optional expiry
  createdAt  DateTime @default(now())

  @@index([userId])
}
```

- **Format:** `wcat_<random>`; displayed once on creation, then only the
  `prefix`. Stored as `sha256` only.
- **Scopes (start read-only):** `endpoints:read`, `requests:read`. Writes
  (delete/replay) intentionally excluded for agent safety; add later behind a
  distinct scope.
- **Managed in Settings** (behind magic-link identity): create, name, revoke,
  see `lastUsedAt`.
- **Auth:** `Authorization: Bearer wcat_…` → hash → look up → check scope +
  expiry → set `userId` context. Rate-limited per token via Upstash.

### 3.2 REST API (read-only, cursor-paginated)

| Method & Path | Purpose |
|---------------|---------|
| `GET /api/v1/endpoints` | List the token owner's endpoints |
| `GET /api/v1/endpoints/:id/requests?cursor=&limit=&method=&status=&since=` | **Fetch** captured requests (paginated, filterable) |
| `GET /api/v1/requests/:id` | Fetch one request in full |
| `GET /api/v1/endpoints/:id/requests/search?q=` | *(optional)* Search (see §3.4) |

Responses are stable, versioned (`/v1`), cursor-paginated, and scoped to the
token's `userId` — an agent can never see another user's data.

### 3.3 MCP server (the agent-native path)

Expose a **remote MCP server** at `/api/mcp` using the Streamable-HTTP transport,
authenticated with the same PAT (bearer). An AI agent adds the server URL + token
and immediately gets tools:

| Tool | Args | Returns |
|------|------|---------|
| `list_endpoints` | — | endpoints (id, name, requestCount, lastActivity) |
| `get_requests` | `endpoint`, `limit?`, `cursor?`, `method?`, `status?`, `since?` | page of captured requests |
| `get_request` | `requestId` | full request (headers, body, query, response) |
| `search_requests` *(optional)* | `endpoint`, `query` | matching requests |

Sketch (Next.js route handler using an MCP adapter such as `mcp-handler` /
`@modelcontextprotocol/sdk` — confirm the current package at build time):

```ts
// src/app/api/mcp/route.ts
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { requireToken } from "@/lib/auth";          // validates bearer PAT → userId
import * as svc from "@/services/requests";          // shared with REST

const handler = createMcpHandler((server) => {
  server.tool("list_endpoints", {}, async (_args, { auth }) =>
    json(await svc.listEndpoints(auth.userId))
  );

  server.tool(
    "get_requests",
    {
      endpoint: z.string(),
      limit: z.number().max(100).default(25),
      cursor: z.string().optional(),
      method: z.string().optional(),
      status: z.number().optional(),
      since: z.string().datetime().optional(),
    },
    async (args, { auth }) => json(await svc.getRequests(auth.userId, args))
  );

  server.tool("get_request", { requestId: z.string() }, async ({ requestId }, { auth }) =>
    json(await svc.getRequest(auth.userId, requestId))
  );
});

// Wrap so every MCP call is authenticated + rate-limited before reaching a tool.
export const POST = withTokenAuth(handler, { scope: "requests:read" });
```

Because tools call the **same service layer** as the REST API, there is one
source of truth for authorization, pagination, and filtering.

### 3.4 Search (optional — "fetch alone is fine")

Per the request, **fetch is the MVP; search is a nice-to-have.** Two levels:

- **Phase 1 (ship now):** rich **filtered fetch** — `method`, `status`, `since`,
  cursor pagination. This already satisfies most agent use cases ("get the last
  20 POSTs that failed").
- **Phase 2 (optional):** real **search** — add a normalized searchable text
  field on `Request` (or use MongoDB Atlas Search) and expose
  `search_requests` / the `/search` REST route. Avoid the current client-side
  `JSON.stringify().includes()` approach for anything programmatic.

### 3.5 Security & abuse

- Read-only scopes by default; writes gated behind an explicit future scope.
- Per-token **rate limiting** + **audit log** (`lastUsedAt`, optional per-call
  log) so a leaked token is detectable and revocable.
- Tokens revocable instantly from Settings; honored by both REST and MCP since
  they share the hash lookup.
- Strict per-`userId` scoping on every query — no cross-tenant access.

### 3.6 Example agent use cases this unlocks

- An AI agent watches an endpoint and **summarizes new payloads** ("3 failed
  Stripe events in the last hour").
- A debugging bot **fetches the latest request** for an endpoint and explains why
  a signature failed.
- A CI bot **pulls the most recent webhook** to assert an integration fired.

---

## 4. Consolidated New Schema (all three features)

```prisma
model User {
  // … existing …
  email           String?   @unique
  emailVerifiedAt DateTime?
}

model MagicLink {     id String @id @map("_id") @db.ObjectId /* + email, tokenHash, userId, expiresAt, consumedAt */ }
model Session   {     id String @id @map("_id") @db.ObjectId /* + userId, tokenHash, expiresAt */ }
model ApiToken  {     id String @id @map("_id") @db.ObjectId /* + userId, name, tokenHash, prefix, scopes[], lastUsedAt, expiresAt */ }
```

Shared building blocks reused across features:

- **`requireOwner(req, userId)`** — session-cookie guard (browser/export).
- **`requireToken(req, scope)`** — PAT guard (REST/MCP).
- **Upstash Redis `@upstash/ratelimit`** — magic-link sends, token calls, export
  requests.
- **Upstash QStash** — large async exports + (from `IMPROVEMENTS.md` §6) retention.
- **Resend** — magic links + pre-expiry export nudges + async-export download
  links.
- **One service layer** (`src/services/*`) behind REST, MCP, and the dashboard.

---

## 5. Environment Variables to Add

| Key | Used by |
|-----|---------|
| `AUTH_SECRET` | Sign/verify session cookies + magic-link state |
| `BLOB_READ_WRITE_TOKEN` (Vercel Blob) | Store large async exports privately |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | Rate limiting (shared with §6) |
| `QSTASH_TOKEN` + signing keys | Async export jobs (shared with retention) |
| `NEXT_PUBLIC_RESEND_KEY` *(exists)* | Magic links + export emails |
| `APP_URL` *(shared)* | Links in emails, MCP/job callbacks |

---

## 6. Rollout Sequencing

**Step 1 — Identity foundation:** magic-link auth + `Session` + `requireOwner`;
retrofit it onto the existing management API (closes the `IMPROVEMENTS.md` §1.1
authz hole). Optional merge UI.

**Step 2 — ZIP export:** synchronous streaming export for typical datasets;
owner-guarded; redaction option. Wire the pre-expiry "export your webhooks"
email into retention.

**Step 3 — Async export at scale:** QStash job → private Blob → emailed signed
link, for large archives.

**Step 4 — Agent access (fetch):** `ApiToken` model + Settings UI; versioned
read-only REST `/api/v1/*` with cursor pagination + filters.

**Step 5 — MCP server:** `/api/mcp` exposing `list_endpoints` / `get_requests` /
`get_request`, sharing the service layer and PAT auth.

**Step 6 — (optional) Search:** searchable index + `search_requests` tool and
`/search` route.

---

## 7. Small Open Questions

1. **Merge behavior** when an email already maps to a different ULID — adopt &
   import (recommended) vs. keep separate. Needs a one-line product call.
2. **Export size threshold** for sync-vs-async handoff (a sensible default:
   stream inline under ~50 MB / ~10–20k requests, else queue).
3. **MCP auth style** — static bearer PAT (simplest, recommended to start) vs.
   full OAuth for the MCP server (nicer "Connect" UX in some clients, more work).
4. **Token write scopes** — keep agents strictly read-only for now (recommended),
   or eventually allow `requests:delete` / `replay` behind explicit scopes.
