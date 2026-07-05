# 07 · Forwarding & Integrations

> **Primary persona:** Integration builder · **Secondary:** Solo debugger
> **Phase:** 2 · **Cites:** `00-prd-overview.md`, `../01-architecture.md §4` (fire-and-forget forwarding),
> `04-create-endpoint.md`, `09-identity-claim.md`

---

## 1. Problem & why now

Today an endpoint can **forward** each captured request to one or more raw
downstream URLs — fire-and-forget (`../01-architecture.md §4`). That's useful but
limited: developers increasingly want webhooks to land somewhere **human-readable**
(a Slack channel, a Telegram chat, a Discord server) as a **formatted alert**, not
a raw JSON replay. This is the "integrations" ask, and it's a natural, high-value
evolution of forwarding for the integration-builder persona.

## 2. Decision (locked) — typed forwarding targets (folded), fire-and-forget v1

Rather than a separate "Destinations" concept, we **fold integrations into the
existing forwarding list as typed targets**: each forwarding target gains a
**type** — `raw URL` (today's behavior, raw replay) or `Slack` / `Telegram` /
`Discord` (a nicely-formatted message). One unified list. Delivery stays
**fire-and-forget** in v1 (consistent with `../00-product-overview.md`; no delivery
records yet). A light **global Integrations page** acts as a catalog + a place to
store **reusable connection credentials**.

> **Mixed-semantics risk (acknowledged):** one list holding both "replay raw" and
> "send formatted alert" can confuse. We resolve it in the UI: the row's type
> selector drives type-specific fields, a **formatted preview**, and an inline
> **setup guide** + **"Test this target"** button — so each row's behavior is
> obvious.

## 3. Target persona & jobs

- **Integration builder:** "When a webhook hits this endpoint, also ping my Slack
  #alerts channel with a readable summary — and still forward raw to my localhost."
- **Solo debugger:** "Get a Telegram ping when my test fires."

## 4. User stories

- As a user, I can add a forwarding target and choose its **type** (raw URL /
  Slack / Telegram / Discord).
- As a user adding a Slack/Telegram/Discord target, I get an **inline setup guide**
  for getting the webhook/bot token, and a **"Test this target"** button that sends
  a sample message so I know it works before saving.
- As a user, each captured request is delivered to all my targets — raw replay for
  URL targets, a **formatted message** for chat targets.
- As a user, I can add an optional **filter** (only certain methods) so I'm not
  spammed. *(Lean v1: simple method filter; richer filtering later.)*
- As a claimed user, I can save a **reusable connection** (e.g. my Slack workspace
  webhook) once and pick it from a dropdown across endpoints.

## 5. Proposed experience

### 5.1 Per-endpoint target list (in create/edit `04` + detail quick-edit)

```
Forwarding & Integrations
  ▸ [ Slack ▾ ]    Connection: [My workspace ▾]  #alerts   filter:[POST] [Test] ✕
  ▸ [ Telegram ▾ ] Bot token / chat id …                   [Test] ✕
  ▸ [ raw URL ▾ ]  https://localhost:3000/hook              [Test] ✕
  + Add target
```

- **Type selector** per row drives the fields shown.
- **raw URL:** today's behavior (clone headers minus host/content-length,
  reconstruct body, `fetch`). Honor the chosen **method** at forward time (fixes
  the `../01-architecture §4.3` caveat) — small correctness win.
- **Slack/Telegram/Discord:** collect the minimal credential (incoming-webhook URL
  or bot token + chat/channel id) and format the captured request into a tidy
  message (method, endpoint, key fields, timestamp, a "view in Webhook Catcher"
  link).

### 5.2 Formatted message (chat targets)

A compact, readable card/message:
```
🔔 swift-otter received POST
200 · 12ms · 2026-06-09 14:22 UTC
type: user.created · id: usr_123
↳ Open in Webhook Catcher
```
- Templated per platform (Slack Block Kit / Telegram markdown / Discord embed).
- **Secret headers/fields redacted** (shared redaction list, `../02-audit §3.4`) so
  alerts don't leak tokens.
- Payload truncated with a link to the full request.

### 5.3 Setup guides (inline)

Each chat type shows a short, copy-paste guide:
- **Slack:** create an Incoming Webhook → paste URL.
- **Telegram:** talk to @BotFather → bot token → chat id.
- **Discord:** Channel → Integrations → Webhooks → copy URL.
Plus a **"Test this target"** button that posts a sample message immediately.

### 5.4 Global Integrations page (catalog + reusable connections)

- A catalog of available types with their guides.
- **Reusable connections** (claimed users): save a Slack/Telegram/Discord
  connection once; reference it by name from any endpoint's target list. (For
  anonymous users, credentials are entered per-target.)

### 5.5 Delivery model (v1)

- **Fire-and-forget**, like today — not awaited, failures caught and logged. No
  per-attempt delivery records in v1 (consistent with the deferred durable-forwarding
  decision). The "Test this target" button is the confidence mechanism instead.
- Documented limitation: no retry, no delivery history (yet). Upgrading to tracked
  delivery is the same `ForwardDelivery` work deferred elsewhere.

## 6. DX details — states

| State | Behavior |
|-------|----------|
| **No targets** | "Forward or alert on every request — add a target." |
| **Adding chat target** | Type-specific fields + inline guide + Test button. |
| **Test in progress** | Spinner on Test; success/fail toast with the platform's response. |
| **Saved** | Targets listed with type icon; next capture delivers to all. |
| **Delivery failure (runtime)** | Logged; (v1) not surfaced per-request — call out the limitation in UI copy. |

- **Security:** credentials redacted in UI after save (show last 4); for claimed
  users stored server-side (encrypted) like other secrets; anonymous users' chat
  credentials live with the endpoint config (warn that anonymous data is losable —
  ties to claim nudge `09`).
- **A11y:** type selector labeled; test result announced.

## 7. Acceptance criteria

- [ ] A forwarding target supports a **type** (raw URL / Slack / Telegram /
  Discord); type drives the fields.
- [ ] raw URL targets behave as today **and honor the configured method** at
  forward time.
- [ ] Chat targets deliver a **formatted, secret-redacted** message on each capture.
- [ ] Each chat type shows an inline setup guide and a working **"Test this
  target"** button.
- [ ] An optional **method filter** can limit which captures trigger a target.
- [ ] Claimed users can save and reuse a named **connection** across endpoints;
  anonymous users enter credentials per target.
- [ ] Targets are ownership-checked and saved atomically with the endpoint (no
  data-loss on partial save — see `04`).
- [ ] UI clearly states delivery is fire-and-forget (no retries/history) in v1.

## 8. Success metrics

- % of endpoints with ≥1 chat target (integration-builder adoption).
- "Test this target" success rate (setup-guide quality).
- Reuse of saved connections among claimed users (claim incentive).

## 9. Out of scope

- **Delivery records / retries / dead-letter** (deferred durable forwarding).
- Rich conditional routing/filtering beyond method (future).
- OAuth-based Slack/Discord app installs (v1 uses incoming-webhook URLs / bot
  tokens; OAuth installs are a future nicety).
- Two-way integrations (replying from Slack, etc.).

## 10. Open questions

1. Does the global Integrations page also show **active destinations across all
   endpoints** (a cross-endpoint view), or stay a catalog + reusable creds only?
   (`00 §9`; lean: catalog + creds v1.)
2. Message **format customization** (let users edit the alert template)? (Lean:
   sensible defaults v1; templating later.)
3. Should chat-target failures get at least a **lightweight last-result indicator**
   (✓/✗ + time) without full delivery records? (Lean: yes if cheap — a single
   "last delivery" field is a big trust win short of full tracking.)
