# 05 · Endpoint Detail & Request Inspector

> **Primary persona:** Solo debugger · **Secondary:** Integration builder, AI-agent user
> **Phase:** 1 (live stream, copy-as-curl, snippets, provider samples, replay, pin) ·
> **Phase 3** (type-gen) ·
> **Cites:** `00-prd-overview.md` (principles 2, 3, 4, 9), `../01-architecture.md §5,§7`,
> `../02-audit-and-roadmap.md §1.1 #3 (pagination), §5.1 (SSE)`, `../UI redesign/02-screen-redesigns.md §2,§3`

---

## 1. Problem & why now

This is the **heart of the product** — where developers watch and understand their
webhooks. Today it: loads **every** request at once (no pagination — falls over at
scale), updates only via a **manual Refresh button** (no live stream — the core
promise of a webhook inspector is broken), pretty-prints bodies into a `<pre>` with
no syntax highlighting or tree, has client-side substring "search", and lacks
replay/pinning/diff. Fixing this is the highest-impact DX work in the whole program
(principle 2). It also hosts the copy-as-curl/snippets and provider-samples wins.

## 2. Target persona & jobs

- **Solo debugger:** "Watch requests land live, open one, read the payload
  instantly, replay it, copy it as curl, done."
- **Integration builder:** "Search/filter my history, pin the important ones,
  understand why one failed."
- **AI-agent user (secondary):** "Explain this payload" (→ `12`).

## 3. User stories

- As a user, new requests **appear live** at the top of the list with a subtle
  animation — no refresh.
- As a user, I can toggle **Live / Paused** and the list won't jump while I'm
  reading.
- As a user, I open a request and see a **collapsible, syntax-highlighted** view of
  headers / body / query, with copy-path and search-within-payload.
- As a user, I can **copy any request as curl** and **copy ready-to-run snippets**
  (Node/Python/Go) pre-filled with this endpoint's URL.
- As a user, I can fire a **provider sample payload** (Stripe/GitHub/Shopify/Twilio)
  at my endpoint in one click to get realistic data.
- As a user, I can **replay** a captured request (resend it to my endpoint) and
  **pin** important requests so retention never deletes them.
- As a user with lots of history, the list **paginates** and **searches
  server-side**.
- (P3) As a user, I can **generate types** (TS / JSON Schema / Zod) from a payload.

## 4. Current-state gaps (→ audit)

- **No pagination** — `GET /api/endpoints/[id]` includes *all* requests
  (`§1.1 #3`). Must become cursor-paginated.
- **No live stream** — manual Refresh only (`§1.3`, `§5.1`). Must become SSE.
- **No syntax highlighting / JSON tree** (`§1.3`). `JsonDisplay` is `stringify` +
  truncate.
- **Client-side search** over loaded data (`§1.3`) — move server-side.
- **Fake metric cards** on this page too (Delivery Success Rate / Avg Response Time
  computed client-side) — replace with truthful ones (see `03` rules).
- **No replay/pin/diff**; replay was promised in the README.

## 5. Proposed experience

### 5.1 Layout — master–detail inspector

A dedicated full-height master–detail screen (Emerald `RequestInspector`):

```
┌ Endpoint head: name · URL [Copy][curl] · Live ● / Paused · Send test · ⋯ ┐
├──────────────────────────┬───────────────────────────────────────────────┤
│ Request list (316px)     │  Inspector (1fr)                               │
│  ● POST  200  12ms  now  │   Tabs: Body · Headers · Query · Response       │
│  ○ POST  200  9ms  2m    │   ┌ syntax-highlighted, collapsible tree ┐      │
│  ○ GET   200  3ms  5m    │   │  { "type": "user.created", … }        │      │
│  …  (cursor-paginated)   │   └───────────────────────────────────────┘      │
│  [pinned float to top]   │   Actions: Copy · Copy as curl · Snippets ▾ ·    │
│                          │   Replay · Pin · Explain with AI (→12) · Diff    │
└──────────────────────────┴───────────────────────────────────────────────┘
```

On mobile the list and inspector stack; selecting a row pushes the inspector.

### 5.2 Live stream (SSE) — the core loop

- Backed by **SSE** (`/api/endpoints/:id/stream`, and a user-wide stream for the
  global Live Requests view). New requests are pushed and **prepended** with a
  highlight-then-fade animation.
- **Live / Paused** toggle (live by default). While Paused, new arrivals are
  buffered and a "N new" pill lets the user catch up without the list jumping
  under them.
- **ARIA live region** announces new arrivals for screen readers (principle 9).
- Pulse dot uses the `livep` keyframe (`../UI redesign §7`).

### 5.3 Payload viewer

- **Collapsible, syntax-highlighted tree** for JSON; content-type-aware rendering
  (JSON / XML / form / raw text / image). Pretty-print large payloads with virtual
  scrolling instead of a 500-char truncation hack.
- **Search-within-payload**, **copy-path** (e.g. `data.object.id`), and copy-value.
- **Header view** keeps the existing noise filter (`filterHeaders`/`unwantedHeaders`)
  but **redacts secret headers** for display (auth, signatures, cookies — shared
  redaction list, `../02-audit §3.4`).

### 5.4 Copy-as-curl & per-language snippets (principle 4)

- **Copy as curl** on any request reconstructs the exact call (method, headers,
  body) against this endpoint's URL.
- **Snippets ▾** offers ready-to-run code in **curl / Node (fetch) / Python
  (requests) / Go**, pre-filled with the **real endpoint URL** and the selected
  request's payload — one-click copy. (Stripe-grade; largely absent from
  competitors → a differentiator.)

### 5.5 Provider sample payloads

- A **"Send sample ▾"** menu with realistic payloads for common providers
  (**Stripe, GitHub, Shopify, Twilio**, + generic). One click fires the sample at
  this endpoint, producing a real captured request — instant realistic data with
  no provider wiring. (Hookdeck's signature feature.)
- Samples are a curated, versioned static set; extensible later.

### 5.6 Replay & pin

- **Replay:** resend a captured request to its endpoint (reuses the playground send
  path). Optional **edit-then-replay**. Show original-vs-replay so the user can
  compare. (Replay was a README promise.)
- **Pin:** mark a request important → it **floats to the top** and is **exempt from
  30-day retention** (`Request.pinned`, ties to `08`). Pinned rows show a "kept"
  chip; unpinned rows show "expires in N days".

### 5.7 Diff (nice-to-have, P1 if cheap)

- Select two requests → side-by-side header/body diff. High value for "why did this
  one fail vs that one". Ship if it fits P1; else P2.

### 5.8 Type generation (P3)

- From any payload: **Generate types → TS interface / JSON Schema / Zod schema**,
  shown in a copyable panel. (typedwebhook.tools differentiator — turns inspection
  into code.) Open question: per-request vs an endpoint-level "Types" tab that
  infers a schema across all captured payloads (`00 §9`).

### 5.9 History controls

- **Server-side search** (method/status/since + body text), **cursor pagination**
  ("load more" / infinite), **Refresh** (still available for manual revalidate),
  **Export** (→ `08`), **Clear all**.
- **Honest metric cards** only (per `03` rules): Lifetime requests, Requests·24h,
  Last activity, Avg **processing** time (clearly labeled as *our* handling time,
  not delivery). **No "Delivery Success Rate"** until durable forwarding exists.

## 6. DX details — states

| State | Behavior |
|-------|----------|
| **Empty** | "Waiting for your first request…" + ghost preview row + Send test + Send sample (this is also the `02` activation surface for the starter). |
| **Live/streaming** | New rows animate in; pulse dot; ARIA announces. |
| **Paused** | Buffered arrivals shown as "N new ↑"; list frozen for reading. |
| **Loading older** | Skeleton rows on "load more". |
| **Error** | Stream drop → auto-reconnect with backoff + a quiet "reconnecting…"; data error → "Couldn't load — Retry". |
| **No search results** | "No requests match" distinct from "no requests yet". |

- **Keyboard:** ↑/↓ move selection, → expand/open inspector, `c` copy body, `y`
  copy as curl, `p` pin, `r` replay, `/` focus search, `Esc` close inspector.
- **A11y:** status by icon **+ text + color**; focus moves into the inspector on
  open and returns on close; live region for arrivals.
- **Mobile:** list/inspector stack; actions in an overflow menu; copy/send
  thumb-reachable.

## 7. Acceptance criteria

- [ ] New requests appear via **SSE** with no manual refresh; Live/Paused toggle
  works and Paused prevents list jump (buffered "N new").
- [ ] Request history is **cursor-paginated**; the page never loads all requests at
  once.
- [ ] History **search is server-side** (method/status/since + body text).
- [ ] Inspector shows **syntax-highlighted, collapsible** Body/Headers/Query/
  Response with search-within-payload and copy-path; secret headers redacted.
- [ ] **Copy as curl** and **Snippets** (curl/Node/Python/Go) produce correct,
  ready-to-run output pre-filled with the real URL + payload.
- [ ] **Send sample ▾** fires realistic provider payloads (Stripe/GitHub/Shopify/
  Twilio/generic) and they appear as real captured requests.
- [ ] **Replay** resends a request; **Pin** floats it to top and exempts it from
  retention; pinned/expiry chips render.
- [ ] No fake metric cards; only truthful ones, with processing-time clearly
  labeled.
- [ ] All §6 states + keyboard map implemented; mobile stacks.
- [ ] (P3) **Generate types** outputs TS + JSON Schema + Zod, copyable.

## 8. Success metrics

- **Live-stream adoption ≥ 80%** of detail sessions keep Live on (principle / `00`).
- Copy-as-curl + snippet copies per active user trending up.
- Sample-send usage in new sessions (realistic-data activation).
- Replay usage among integration builders.
- Inspector open → time-to-understand (qualitative) drops vs the old `<pre>`.

## 9. Out of scope

- Durable forwarding delivery view (deferred → no delivery success metric).
- Payload transformation/scripting.
- Saved searches / search across all endpoints (single-endpoint scope v1; global
  Live Requests view is a separate surface).

## 10. Open questions

1. **Type-gen surface:** per-request panel vs endpoint-level "Types" tab that
   merges a schema across payloads? (Lean: ship per-request in P3; aggregate tab as
   a follow-up.)
2. **Diff** in P1 or P2? (Lean: P1 if the viewer work makes it cheap, else P2.)
3. Provider-sample library: how many providers at launch, and do we let users save
   their **own** samples? (Lean: ~5 curated at launch; user-saved samples later.)
4. Global **Live Requests** view (sidebar item) — same inspector across all
   endpoints; confirm it shares this component and a user-wide SSE stream.
