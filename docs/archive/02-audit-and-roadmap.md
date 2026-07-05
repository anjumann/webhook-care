# Webhook Catcher — Improvement & Re-Architecture Proposal

> Authored from the perspective of a Senior UX/UI Designer **and** a Senior
> Engineer reviewing the current codebase. The goal is a candid audit followed by
> a concrete, prioritized roadmap. Where it makes sense, I recommend
> re-implementing rather than patching. The headline new capability — **30-day
> automatic webhook retention powered by Upstash** — is specified in full in §6.

---

## 0. TL;DR — What I'd Do First

| Priority | Theme | Why it matters |
|---------|-------|----------------|
| **P0** | **Authorization on the management API** | Today any browser can read/delete *anyone's* endpoints and requests by guessing a `userId`. This is the single biggest risk. |
| **P0** | **Data retention (30-day auto-delete)** | Unbounded growth = cost + a `Request` table that eventually can't be loaded. This is the requested feature; design in §6. |
| **P0** | **Pagination on request history** | The detail page loads **every** request for an endpoint at once. It will fall over. |
| **P1** | **Rate limiting + abuse protection** | The webhook ingest is a public, unauthenticated write endpoint. |
| ~~P1~~ | ~~Durable, observable forwarding~~ | **Deferred (free plan).** Forwarding stays exactly as-is — fire-and-forget. Revisit only if it becomes a paid/reliability feature. |
| **P1** | **Identity you can't lose / recover** | Identity is a ULID in `localStorage`. Clear your browser and everything is orphaned forever. |
| **P2** | **Real-time request stream (SSE)** | The README promises real-time; reality is a manual *Refresh* button. |
| **P2** | **UX polish**: empty states, request diffing, syntax highlighting, keyboard nav, mobile | Turns a functional tool into a delightful one. |
| **P3** | **Engineering hygiene**: service layer, tests, stop committing the generated Prisma client, fix small bugs | Long-term velocity. |

---

## 1. Honest Audit of the Current Application

The app is genuinely good for an MVP — clean Next.js App Router structure, a
sensible Prisma schema, nice shadcn UI, and a clever "no sign-up" ULID identity.
But several things will bite at scale or in production. I'll separate
**correctness/security bugs** from **architecture** from **UX**.

### 1.1 Security & Correctness (must-fix)

1. **No authorization anywhere on the management API.** `GET
   /api/endpoints?userId=`, `DELETE /api/endpoints/[id]`, `DELETE
   /api/requests/[id]`, `PUT /api/user/profile`, etc. accept any caller. The
   `userId` is a guessable path/query value, and there is no session, signature,
   or ownership check. Anyone can enumerate or destroy another user's data.
2. **The webhook ingest is an open write endpoint with no rate limiting.** A bad
   actor can hammer `/api/webhook/{userId}/{name}` and inflate storage/cost or
   DoS a forwarding target through you.
3. **Request history loads everything.** `GET /api/endpoints/[id]` does
   `include: { requests: { orderBy: { createdAt: "desc" } } }` with no `take`.
   On a busy endpoint this is an unbounded query, a huge JSON payload, and a slow
   page. There is **no pagination** anywhere.
4. **Body parsing silently drops most content types.** Only
   `application/json` and `application/x-www-form-urlencoded` are captured;
   `text/*`, `application/xml`, `multipart/form-data`, and binary bodies become
   `null`. Many real webhooks (Twilio, some Slack, SOAP) are lost.
5. **Secrets are stored verbatim in headers/body.** Signature headers, bearer
   tokens, and API keys land in Mongo unredacted. Combined with #1 that's a
   data-exposure problem.
6. **Forwarding is fire-and-forget.** `Promise.allSettled(...)` is not awaited,
   there are **no retries**, **no timeout**, and **no record** of whether
   delivery succeeded — yet the UI has a "Delivery Success Rate" card. The
   `ForwardingUrl.method` field is captured in the UI but ignored at runtime (the
   incoming method is used instead).
7. **Edit endpoint is a non-atomic delete-then-recreate.** `PUT
   /api/endpoints/[id]` does `forwardingUrl.deleteMany` then `update.create`. If
   the second call fails, forwarding URLs are gone. It also doesn't verify the
   endpoint belongs to the caller.
8. **`statusCode` is hard-coded to 200.** The README promises custom status
   codes, response bodies, headers, and delays — none of it exists. The success
   metric is therefore always 100%.
9. **Concrete small bugs:**
   - `useUser` returns `imageUrl: \`/avatar/${user?.imageUrl}\``, but
     `user.imageUrl` is already `"/avatar/zoro.jpg"` → you get
     `"/avatar//avatar/zoro.jpg"` (broken image).
   - `getProfile` builds `\`/api/user/profile?userId=${userId}  \`` with trailing
     spaces in the URL.
   - `WebhookTestSection` does `JSON.parse(initialPayload)` unguarded in
     `useState` init — a malformed sample payload throws during render.
   - `endpoints/types.ts` is empty; `Endpoint`/`Request` types are redefined in
     three places with drift.

### 1.2 Architecture

- **Identity is fragile and unrecoverable.** A ULID in `localStorage` is the
  only key to a user's data. Clearing storage, switching devices, or using
  incognito means total, permanent loss. There's no export/import, no "claim
  this dashboard," no recovery.
- **Three different data-fetching styles** coexist: server actions
  (`createOrGetUser`), SWR hooks (`useEndpoints`), and bare `fetch` helpers
  (`getEndpoint`, `updateProfile`). No single source of truth, inconsistent error
  handling, no shared HTTP client.
- **No service/repository layer.** Prisma calls and business logic live directly
  in route handlers, so logic (e.g., "sanitize endpoint name") is duplicated and
  untested.
- **No caching layer.** Every dashboard load hits Mongo. Hot endpoints
  re-query constantly.
- **The generated Prisma client is committed to the repo** (`generated/prisma`),
  including a platform-specific `.dylib`. This bloats the repo and breaks across
  OS/CI. It should be generated at build time and git-ignored.
- **No tests, no CI checks beyond lint**, and no observability (structured logs,
  tracing, error reporting).
- **Metrics are computed client-side** over the full request set on every render
  — won't scale and can't power a dashboard.

### 1.3 UX/UI

- **"Real-time" is actually a manual Refresh button.** The core promise of a
  webhook inspector is watching requests arrive live.
- **No syntax highlighting / collapsible JSON tree.** Bodies are
  `JSON.stringify`'d into a `<pre>`. Hard to scan large payloads.
- **No request diffing**, no "replay this exact request," no pinning/starring
  important requests.
- **Search is client-side `JSON.stringify().includes()`** over already-loaded
  data — fine for 50 rows, useless at 50k.
- **Dead/placeholder UI**: "Success Rate" / "Avg Response Time" cards on the
  dashboard say "To be implemented"; commented-out chart sections; "View
  Integration Guide" button goes nowhere.
- **Onboarding is thin.** First-run users land on an empty dashboard; there's no
  guided "here's your URL, send a test" moment.
- **Accessibility & mobile** haven't been audited (table-heavy layouts,
  focus management on expand/collapse, color-only status encoding).

---

## 2. Target Architecture (the re-implementation I'd pursue)

You said a full re-implementation is acceptable. Here's the shape I'd aim for. It
keeps the parts that work (Next.js App Router, Prisma, shadcn) and hardens the
rest.

```
                         ┌─────────────────────────────────────────┐
   Webhook providers ───▶│  POST /api/webhook/:userId/:name         │
   (Stripe, GitHub…)     │  • rate-limited (Upstash Redis)          │
                         │  • parses any content-type + raw body    │
                         │  • writes Request (with expiresAt)       │
                         │  • enqueues forwarding job (QStash)      │
                         └───────────────┬─────────────────────────┘
                                         │ publish
                                         ▼
                         ┌─────────────────────────────────────────┐
   Upstash QStash ──────▶│  POST /api/jobs/forward                  │ retries + DLQ
   (queue + retries)     │  • delivers to each forwarding URL       │
                         │  • records ForwardDelivery (status/ms)   │
                         └─────────────────────────────────────────┘

   Upstash QStash ──────▶  POST /api/jobs/retention   (cron: 0 0 * * *, midnight)
   (schedule)              • fans out per-endpoint delete batches  (see §6)

   Browser (dashboard) ──▶ Next.js Server Components + SSE stream + typed API
                           • signed, HttpOnly session cookie (ownership)
                           • SWR/React Query for client mutations
                           • Redis cache for hot reads + metrics counters
```

**New infra (all Upstash, single vendor):**

| Component | Upstash product | Use |
|-----------|-----------------|-----|
| Rate limiting + cache + metrics counters | **Upstash Redis** + `@upstash/ratelimit` | Per-IP/endpoint limits, cached endpoint lookups, atomic request counters |
| Durable forwarding | **Upstash QStash** | At-least-once delivery with automatic retries + dead-letter |
| Scheduled retention sweep | **Upstash QStash Schedules** | Cron at midnight to purge/expire old requests (§6) |

---

## 3. Security & Identity Improvements

### 3.1 Make identity recoverable without forcing sign-up

Keep the zero-friction first run, but stop making `localStorage` the *only* copy
of identity.

- **Server-issued session.** On first dashboard visit, set a **signed, HttpOnly
  cookie** carrying the ULID (and a server-side secret HMAC). The path stays
  `/{userId}` for shareable URLs, but **ownership is proven by the cookie**, not
  by knowing the URL. The management API checks `cookie.userId === route.userId`.
- **Optional "claim your dashboard."** Let a user attach an email (magic link via
  Resend, which is already wired up). Claiming enables cross-device access and
  recovery. Still optional — anonymous remains the default.
- **Export / import.** A one-click JSON export of all endpoints (already partially
  built for requests) doubles as a backup and a migration path.

### 3.2 Authorize every management route

Introduce a tiny middleware/helper:

```ts
// requireOwner(request, userId) -> throws 401/403 unless the signed session
// matches. Wrap every /api/endpoints, /api/requests, /api/user route with it.
```

The **public webhook ingest stays open** (that's the point), but everything that
reads or mutates stored data is gated.

### 3.3 Protect the ingest

- **Rate limit** per IP and per endpoint with `@upstash/ratelimit` (sliding
  window). Return `429` with `Retry-After`.
- **Body size cap** (e.g., 1–2 MB) and **request-count cap per endpoint** to
  bound storage.
- **Optional endpoint auth**: let users require an API key / bearer / HMAC
  signature on their endpoint (the README envisioned this).

### 3.4 Redact secrets at write time

Maintain a denylist of sensitive header names (`authorization`,
`x-*-signature`, `cookie`, etc.). Store a redacted copy for display and keep the
raw value encrypted (or drop it) based on a per-endpoint setting.

---

## 4. Data & Ingest Improvements

- **Capture every content-type.** Always read the **raw body** as text/bytes and
  store it; *additionally* store a parsed view when the content-type is known
  (JSON, form, XML→object). Never silently lose the payload.
- **Pagination + cursors.** `GET /api/endpoints/:id/requests?cursor=&limit=50`
  using `createdAt`/`_id` cursor pagination. The detail page should never load
  more than a page.
- **Server-side search.** Index method/status/createdAt; for body search, store a
  normalized/searchable text field or use Mongo Atlas Search. Move search off the
  client.
- **Precomputed metrics.** Maintain per-endpoint counters in Redis (and/or a
  rollup collection) for request count, success rate, avg latency — so the
  dashboard reads O(1) instead of scanning requests.
- **Durable forwarding with delivery records.** New model:

  ```prisma
  model ForwardDelivery {
    id          String   @id @default(auto()) @map("_id") @db.ObjectId
    requestId   String   @db.ObjectId
    url         String
    status      String   // pending | success | failed | retrying
    statusCode  Int?
    attempts    Int      @default(0)
    durationMs  Int?
    error       String?
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt
  }
  ```

  The ingest enqueues a QStash job per request; the job handler delivers, records
  the result, and QStash handles retries/backoff + dead-letter. Now "Delivery
  Success Rate" is real.

---

## 5. UX/UI Improvements (Senior Designer pass)

### 5.1 The core loop: live request inspection

- **Live stream via SSE.** Replace the Refresh button with a Server-Sent Events
  endpoint (`/api/endpoints/:id/stream`) that pushes new requests as they arrive.
  Add a "Live / Paused" toggle and a subtle "new request" animation. This is the
  single highest-impact UX change.
- **Rich payload viewer.** Collapsible JSON tree with syntax highlighting,
  search-within-payload, copy-path, and content-type-aware rendering
  (JSON/XML/form/raw/image). Pretty-print large payloads without truncation
  hacks.
- **Request diff.** Select two requests → side-by-side diff of headers/body. Huge
  for debugging "why did this one fail."
- **Replay & edit-then-replay.** First-class replay (the README's "Webhook
  Replay") wired to the existing playground component, with original-vs-replay
  comparison.
- **Pin / star requests.** Pinned requests are exempt from the 30-day purge
  (ties into §6) and float to the top.

### 5.2 Onboarding & empty states

- A guided first-run: "Here's your endpoint URL → send a test → watch it land,"
  with a live cURL/Send button and a confetti moment on the first captured
  request.
- Replace placeholder metric cards with real numbers or hide them until
  implemented. No "To be implemented" in production UI.

### 5.3 Retention surfaced in the UI (ties to §6)

- Each request row shows a subtle **"expires in N days"** chip; pinned requests
  show **"kept."**
- Endpoint settings expose a **retention selector** (24h / 7d / 30d / pinned-only)
  with 30 days as default.
- A dashboard banner near the limit: "Older requests are auto-deleted after 30
  days. Pin the ones you need."

### 5.4 Navigation, a11y, mobile

- **Command palette** (`cmdk` is already a dependency) for jump-to-endpoint,
  create, copy URL, toggle theme.
- **Keyboard navigation** for the request list (↑/↓ to move, → to expand, `c` to
  copy).
- **Accessibility**: status conveyed by icon+text not color alone, focus
  management on expand/collapse and dialogs, ARIA on the live region for new
  requests.
- **Mobile**: collapse the request table into cards; make the copy-URL and
  send-test actions thumb-reachable.

### 5.5 Consistency

- One toast system (currently `react-hot-toast` + `sonner` are both installed —
  pick one).
- A single typed API client + React Query/SWR everywhere (no bare `fetch`
  helpers with trailing-space bugs).

---

## 6. NEW FEATURE — 30-Day Automatic Retention via Upstash

**Goal:** every captured webhook is automatically deleted **30 days** after it
was received. A scheduled job runs **at midnight** and removes anything older
than the retention window. We use **Upstash** for the scheduling/queue layer.

> **Senior recommendation up front (trade-off, then the requested design):**
> The simplest possible implementation is a **MongoDB TTL index** on the
> `Request` collection — Mongo deletes expired docs automatically, no cron, no
> queue, no compute. It is the most reliable and cheapest option. **I recommend
> running the TTL index as a safety net** *and* the Upstash scheduled job as the
> primary, observable, business-logic-aware sweeper (it can respect "pinned"
> requests, per-endpoint retention overrides, keep counters in sync, and emit
> metrics — things a blind TTL can't). Below is the full Upstash design you
> asked for, plus the TTL fallback.

### 6.1 Data model changes

Add an explicit `expiresAt` so retention is data-driven and per-endpoint
overridable, plus a `pinned` flag so important requests survive.

```prisma
model Request {
  // … existing fields …
  pinned    Boolean  @default(false)
  expiresAt DateTime // = createdAt + endpoint.retentionDays (default 30)

  @@index([endpointId])
  @@index([expiresAt])          // makes the nightly delete fast
}

model Endpoint {
  // … existing fields …
  retentionDays Int @default(30) // per-endpoint override; default 30
}
```

- When a webhook is captured, set
  `expiresAt = now + (endpoint.retentionDays ?? 30) days`.
- **MongoDB TTL safety net (optional but recommended):** create a TTL index so
  Mongo purges anything the job misses:

  ```js
  // one-time, e.g. in a migration script
  db.Request.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
  ```

  With `expireAfterSeconds: 0`, Mongo deletes each doc once `expiresAt` passes.
  (If you want the Upstash job to be the *only* deleter, skip this index and
  rely on the scheduled sweep.)

### 6.2 Scheduling at midnight with Upstash QStash

QStash **Schedules** are cron-driven and call an HTTPS endpoint on your app.
Create a schedule (once, via the QStash dashboard, API, or an infra script):

```bash
curl -X POST https://qstash.upstash.io/v2/schedules/https://YOUR_APP/api/jobs/retention \
  -H "Authorization: Bearer $QSTASH_TOKEN" \
  -H "Upstash-Cron: 0 0 * * *"          # 00:00 every day
```

> **Timezone note:** QStash cron runs in **UTC**. "Midnight" therefore means
> 00:00 UTC. If you need a specific local midnight, adjust the cron hour
> accordingly (e.g. `0 5 * * *` for 00:00 America/New_York during EST), or make
> the retention window timezone-agnostic (it's a 30-day age check, so exact
> midnight isn't semantically critical).

### 6.3 The retention endpoint (secured + fan-out)

The schedule hits `POST /api/jobs/retention`. Two responsibilities:

1. **Verify the call really came from QStash** (signature verification) so this
   destructive endpoint can't be triggered by anyone.
2. For scale, **don't delete millions of rows in one request** — fan out per
   endpoint (or per batch) as individual QStash messages so each unit is small,
   retryable, and within the function timeout.

```ts
// src/app/api/jobs/retention/route.ts
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { Client } from "@upstash/qstash";
import { prisma } from "@/lib/prisma";

const qstash = new Client({ token: process.env.QSTASH_TOKEN! });

async function handler() {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Find endpoints that still have expired, unpinned requests.
  const endpoints = await prisma.endpoint.findMany({ select: { id: true } });

  // Fan out: one durable job per endpoint. QStash retries each independently.
  await Promise.all(
    endpoints.map((e) =>
      qstash.publishJSON({
        url: `${process.env.APP_URL}/api/jobs/retention/purge`,
        body: { endpointId: e.id, cutoff: cutoff.toISOString() },
        retries: 3,
      })
    )
  );

  return Response.json({ scheduled: endpoints.length });
}

// QStash signs every request; this rejects anything not from QStash.
export const POST = verifySignatureAppRouter(handler);
```

```ts
// src/app/api/jobs/retention/purge/route.ts  — does the actual deletion in batches
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { prisma } from "@/lib/prisma";

async function handler(req: Request) {
  const { endpointId, cutoff } = await req.json();

  // Delete expired, UNPINNED requests for this endpoint.
  // deleteMany is bounded per endpoint; loop if you expect very large volumes.
  const { count } = await prisma.request.deleteMany({
    where: {
      endpointId,
      pinned: false,
      // prefer expiresAt if you store it; createdAt works as a fallback
      createdAt: { lt: new Date(cutoff) },
    },
  });

  // Keep counters honest (don't decrement lifetime requestCount — that's
  // "lifetime"; instead expose a separate "stored requests" count if needed).
  return Response.json({ endpointId, deleted: count });
}

export const POST = verifySignatureAppRouter(handler);
```

**Why fan-out?** A single nightly `deleteMany` across the whole collection can
exceed function time limits and is all-or-nothing. Per-endpoint jobs are small,
**idempotent** (re-running deletes nothing new), independently **retried** by
QStash, and land in a **dead-letter queue** if they keep failing — giving you
observability instead of a silent cron.

> ⚠️ **QStash free-tier constraint (1,000 messages/day).** Per-endpoint fan-out
> publishes one QStash message per endpoint per night, so with >1,000 endpoints
> we'd blow the free quota. **On the free plan, do NOT fan out per endpoint.**
> Instead the midnight schedule (1 message/day) hits a **single retention job**
> that does the deletion itself in **internal batches** — a loop of bounded
> `deleteMany` calls (e.g. 1–5k docs per pass) over expired, unpinned requests
> until none remain, with the **MongoDB TTL index as the real safety net**. This
> keeps us at ~1 QStash message/day. Keep the fan-out design documented above as
> the scale-up path for if/when we leave the free tier.

### 6.4 Upstash Redis for rate limiting (same vendor, while we're here)

```ts
// src/lib/ratelimit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const ingestLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 req/min per key
  analytics: true,
});
```

Use it at the top of the webhook handler (`const { success } = await
ingestLimit.limit(ip); if (!success) return 429`).

### 6.5 Environment variables to add

| Key | Purpose |
|-----|---------|
| `QSTASH_TOKEN` | Publish messages / create schedules |
| `QSTASH_CURRENT_SIGNING_KEY` / `QSTASH_NEXT_SIGNING_KEY` | Verify incoming QStash requests |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Redis (rate limit, cache, counters) |
| `APP_URL` | Base URL used when publishing job callbacks |

### 6.6 Rollout plan for retention

1. **Migrate schema:** add `expiresAt`, `pinned`, `retentionDays`; backfill
   `expiresAt = createdAt + 30d` for existing rows.
2. **Ship the endpoints** (`/api/jobs/retention` + `/purge`) behind QStash
   signature verification. Test by publishing a manual QStash message.
3. **Dry-run mode:** add a `?dryRun=true` (or env flag) that *counts* what would
   be deleted and logs it for a few nights before enabling real deletes.
4. **Create the midnight schedule** (`0 0 * * *`).
5. **Add the TTL index** as a safety net (optional).
6. **Surface retention in the UI** (§5.3): per-request "expires in N days,"
   pinning, per-endpoint retention selector.
7. **Observability:** emit metrics (rows deleted/night, job failures) and alert
   on DLQ.

### 6.7 Quick comparison of the deletion options

| Approach | Pros | Cons |
|---------|------|------|
| **Mongo TTL index** | Zero compute, fully managed, never "forgets" | Can't honor pinning/overrides, no metrics, deletes silently, ~60s granularity |
| **Upstash QStash schedule + fan-out (requested)** | Business-aware (pinning, per-endpoint window), retries, DLQ, observable, runs at a defined time | Requires the endpoints + signature verification + a little more infra |
| **Vercel Cron** | Native to the platform, simple | Single vendor lock to Vercel; you specifically want Upstash; no built-in retries/DLQ |

**My call:** Upstash QStash schedule as the primary mechanism (per your
requirement), with a Mongo TTL index as a belt-and-suspenders safety net.

---

## 7. Engineering Hygiene

- **Stop committing `generated/prisma/`.** Add it to `.gitignore`; run `prisma
  generate` in `postinstall`/build. Removes the platform `.dylib` from the repo.
- **Introduce a service layer** (`src/services/endpoints.ts`, `requests.ts`) so
  route handlers stay thin and logic is testable. Centralize name sanitization,
  ownership checks, and retention math.
- **One typed API client** + React Query (or standardize on SWR) — delete the
  bare `fetch` helpers and their bugs.
- **Tests:** unit tests for the webhook parser + retention logic; integration
  tests for the ingest → store → forward path; a Playwright smoke test for the
  create-endpoint → send-webhook → see-it-land flow.
- **Observability:** structured logging, a `requestId`, and an error reporter
  (Sentry). Replace `console.error` scattered across routes.
- **Fix the small bugs** listed in §1.1 #9.
- **Consolidate types** into `src/endpoints/types.ts` (currently empty) and import
  everywhere.

---

## 8. Suggested Sequencing (phased)

**Phase 1 — Safety & scale (1–2 wks):** authorize the management API; add Upstash
rate limiting; paginate request history; ship the 30-day retention feature (§6);
add the TTL safety net.

**Phase 2 — Trust & durability (1–2 wks):** durable forwarding via QStash +
delivery records + real success-rate metric; raw-body capture for all
content-types; secret redaction; recoverable identity (optional email claim +
export/import).

**Phase 3 — Delightful UX (2–3 wks):** SSE live stream; rich JSON viewer; request
diff; replay; pinning UI + retention chips; command palette; a11y + mobile pass;
remove placeholder UI.

**Phase 4 — Hygiene & confidence (ongoing):** service layer; test suite;
observability; stop committing generated client; type consolidation.

---

## 9. Appendix — Decisions That Need a Product Call

These aren't blockers, but they shape the build and are genuinely your call:

1. **Default retention = 30 days, deletion semantics:** hard delete (chosen here)
   vs. soft-delete + later purge (lets you offer "undo"). Pinned requests are
   exempt — confirm that's desired.
2. **"Midnight" timezone:** UTC (QStash default) vs. a specific region. The
   retention check is age-based, so exact midnight is cosmetic — but the schedule
   hour needs a decision.
3. **Identity model:** ✅ **RESOLVED** — anonymous-first, with optional
   **email / magic-link claim** for recovery and cross-device access (uses the
   existing Resend integration). This unlocks two further confirmed features —
   **ZIP export** of webhooks and **AI-agent API/MCP access**. Full design for
   all three lives in **`03-feature-designs.md`**.
4. **Plan limits / monetization:** ✅ **RESOLVED — out of scope.** The product is
   **all-free for now**; there are no paid tiers. The `/pricing` page (a
   waitlist that advertised unbuilt Pro features) has been **removed**. Retention
   is a flat **30 days for everyone**, and no feature is gated behind a plan.
   Revisit monetization later as a separate effort if needed.
