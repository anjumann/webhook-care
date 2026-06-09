# 13 · API Client (Standalone)

> **Primary persona:** Integration builder · **Secondary:** Solo debugger
> **Phase:** 3 · **Cites:** `00-prd-overview.md`, `../04-implementation-plan.md §B.6`,
> `../01-architecture.md §7.1` (existing WebhookTestSection), `05-endpoint-detail-inspector.md`

---

## 1. Problem & why now

While debugging webhooks, developers frequently need to make a **quick arbitrary
API call** — hit an endpoint to compare, re-trigger a provider, check a token —
without leaving the tool for Postman/curl. We already have the **endpoint
playground** (`WebhookTestSection`), but it's deliberately locked to a single
endpoint's URL. A **standalone API client** reuses that UI with an **editable,
arbitrary URL** so users stay in flow. The explicit risk is scope creep toward a
Postman clone — so v1 is deliberately **minimal**.

## 2. Decision (locked)

- **Minimal, no saved history in v1.** A single request composer: method + URL +
  headers + body, **Send**, see the response. No collections, no history, no
  environments. Reuse the playground's compose UI; the only difference from the
  endpoint playground is the **editable URL**.
- Framed as *"quick API calls without leaving Webhook Catcher,"* **not** a general
  API platform.

## 3. Target persona & jobs

- **Integration builder:** "Fire a quick request at an external API while I'm
  debugging, without context-switching to Postman."
- **Solo debugger:** "Re-hit a URL with a tweaked header and read the response."

## 4. User stories

- As a user, I open **API Client** and compose a request: method, **arbitrary
  URL**, headers, JSON body (with beautify), optional query params.
- As a user, I click **Send** and see status, time, size, response headers, and a
  pretty/raw body.
- As a user, the UI feels identical to the endpoint playground I already know.

## 5. Proposed experience

### 5.1 Layout (two-column, shared with playground)

```
┌ Compose ─────────────────────────┬ Response ──────────────────┐
│ [ POST ▾ ]  https://api.…/v1/x    │ 200 · 142ms · 1.2KB        │
│ Headers   key            value  ✕ │ ┌ pretty | raw | headers ┐ │
│ Body  { … }   [JSON ▾] [Beautify] │ │ { "ok": true, … }      │ │
│ Query params (optional)           │ └────────────────────────┘ │
│                       [ Send ]    │                            │
└───────────────────────────────────┴────────────────────────────┘
```

- **Shared compose component:** build the compose UI once; the endpoint playground
  passes a **locked URL**, the API client passes an **editable URL**
  (`../UI redesign/02-screen-redesigns.md §5`).
- **Send** uses the same fetch path as the playground (auto-add `Content-Type:
  application/json` when a body is present and none set).
- **Response panel:** status + duration + size; tabs for pretty body / raw /
  response headers; copy buttons; copy-as-curl of the request.

### 5.2 Guardrails (keep it minimal + safe)

- Reasonable timeout + body-size cap.
- Make clear this calls **external URLs from the user's browser/our server** — be
  explicit about which (to set CORS expectations); prefer a server proxy for
  arbitrary URLs to avoid CORS pain, with the same redaction hygiene for any logs.
- No persistence: nothing saved between sessions in v1.

## 6. DX details — states

| State | Behavior |
|-------|----------|
| **Idle** | Empty composer, method defaults to GET, URL focused. |
| **Invalid** | URL/JSON validation inline; Send disabled until valid. |
| **Sending** | Send shows progress; cancelable. |
| **Response** | Status/time/size + tabbed body/headers; copy + copy-as-curl. |
| **Error** | Network/timeout/CORS surfaced plainly with a hint. |

- **Keyboard:** ⌘↵ sends; `/` focuses URL; tab through header rows.
- **A11y:** labeled fields; response status announced.
- **Reuse:** explicitly the same component as the endpoint playground (consistency
  + half the build).

## 7. Acceptance criteria

- [ ] A standalone API Client route exists (e.g. `/dashboard/[userId]/api-client`).
- [ ] User can set **arbitrary** method + URL + headers + JSON body (beautify) +
  query params and **Send**.
- [ ] Response shows status, time, size, headers, and pretty/raw body with copy +
  copy-as-curl.
- [ ] The compose UI is the **same component** as the endpoint playground (locked vs
  editable URL the only difference).
- [ ] No persistence in v1 (no saved requests/history/collections).
- [ ] Timeout, body-size cap, and CORS/proxy behavior handled with clear messaging.

## 8. Success metrics

- API Client sessions per active user (does it earn its place?).
- Whether usage justifies adding saved history in v2 (the explicit follow-up gate).
- Scope discipline: no creep into collections/environments in v1.

## 9. Out of scope

- Saved requests, history, collections, environments, variables (revisit in v2 only
  if v1 shows demand — `../04-implementation-plan.md §B.6`).
- Auth helpers (OAuth flows, signing) — paste headers manually v1.
- Import/export of requests; scripting/tests (Postman territory) — out.

## 10. Open questions

1. **Browser fetch vs server proxy** for arbitrary URLs — proxy avoids CORS but
   means traffic flows through us (logging/abuse considerations). (Lean: server
   proxy with rate limiting + no body persistence.)
2. Should the API Client be **claim-gated** (it can hit arbitrary URLs via our
   proxy = potential abuse vector)? (Lean: rate-limit anonymous heavily; consider
   claim-gating if abused.)
3. Do we pre-fill the URL with the user's **own** webhook endpoints as suggestions?
   (Lean: yes — handy autocomplete, bridges to the playground.)
