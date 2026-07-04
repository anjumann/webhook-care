# 02 · Onboarding & Activation

> **Primary persona:** Solo debugger · **Secondary:** Integration builder
> **Phase:** 1 · **Cites:** `00-prd-overview.md` (DX principles 1, 7, 8),
> `../01-architecture.md §3` (anonymous ULID), `05-endpoint-detail-inspector.md`

---

## 1. Problem & why now

The single most important number for a webhook tool is **time-to-first-capture
(TTFC)** — how long from landing to seeing your first real request arrive. The
industry consensus is the "5-minute aha" rule; the category leader (webhook.site)
wins on a TTFC of *seconds* because a usable URL exists the instant you arrive.

Today our flow is ~5 steps with a manual refresh:
`/` → "Get Started" → `/dashboard/{ULID}` → create-endpoint form → copy URL →
send → **manually refresh** to see it. The first "aha" is buried behind a form and
a refresh button. This is the biggest activation gap we have.

## 2. Target persona & jobs

- **Solo debugger:** "I want a working URL and to watch my webhook land, *now*,
  without filling out anything."
- **Integration builder (secondary):** "Once I see it works, let me name it and
  point a real provider at it."

## 3. Decision (locked)

**1-click create-first activation.** On first dashboard load we **auto-create a
starter endpoint** (random friendly name, e.g. `swift-otter`) and land the user
**directly on its detail page**, where the URL and an inline **Send test** button
are immediately available. No form is required to start; the create form remains
for deliberate creation. Naming/forwarding become *optional refinements*, not
gates. (See `00 §3 principle 1`.)

## 4. User stories

- As a brand-new visitor, within seconds of arriving I have a real, copyable
  webhook URL and a one-click way to send a test to it.
- As a new user, when my first request lands I **see it appear live** with a
  small celebratory moment — I immediately understand the product.
- As a new user, I'm offered (once, gently) the chance to **save my dashboard** so
  I don't lose it — but I'm never blocked or nagged.
- As a returning anonymous user on the same browser, I land back on my data with
  no friction.

## 5. Proposed experience — the activation path

```
Land on "/"  ──▶  "Get Started" (or auto on return)
        │
        ▼
/dashboard/{ULID}  ──▶  no endpoints?  ──▶  auto-create "swift-otter"
        │                                         │
        └──────────────── route to ──────────────┘
                              ▼
        /dashboard/{ULID}/{starterId}   (endpoint detail)
        ┌────────────────────────────────────────────┐
        │ URL: …/api/webhook/{ULID}/swift-otter [Copy]│
        │ [ Send test request ]   (one click)         │
        │ Live ●  — waiting for your first request…   │
        └────────────────────────────────────────────┘
                              │ request arrives (SSE)
                              ▼
        ✨ "First request captured!"  (one-time)
           └─ [Save your dashboard]  (dismissible, once — see 09)
```

### 5.1 First-run detail page (the activation surface)

The starter endpoint's detail page is purpose-built for first value:
- **Prominent webhook URL** with one-click copy and **copy-as-curl**.
- A big **"Send test request"** button that fires a sample payload at the endpoint
  (reuses the playground send path). This guarantees a capture even if the user
  hasn't wired a provider yet.
- The **live stream** is already on; the empty state reads "Waiting for your first
  request…" with the pulse dot.
- A compact **"or send your own"** snippet block (curl + provider samples teaser,
  full version in `05`).

### 5.2 The "aha" moment

When the first request lands (via SSE), the row animates in and a **one-time
inline celebration** appears ("First request captured! 🎉"). This is the moment we
attach the **single, dismissible** claim nudge (`09-identity-claim`).

### 5.3 Empty-state philosophy (research-backed)

- **Single next action:** the empty detail page surfaces exactly one primary action
  (Send test), not a wall of options. (Hiding secondary actions until the first
  completes lifts activation.)
- **Preview the end-state:** the live panel shows what a captured request *will*
  look like (a ghost/sample row) so the populated state is legible before any data
  arrives.
- **Teach, don't blank:** every empty state explains the next step in one line.

### 5.4 Optional micro-tour

A **≤3-step**, skippable, inline coachmark sequence (not a modal takeover):
1. "This is your webhook URL — point any provider here."
2. "Send a test to see it land live."
3. "Pin or replay any request from here."
Devs can dismiss instantly; never shown again. (Research: devs reject heavy tours;
keep it tiny and optional.)

## 6. DX details

- **States:** Empty (waiting for first request, with ghost preview + Send test);
  Loading (skeleton); Error (auto-create failed → "Couldn't set you up — Retry");
  Populated (first request animates in → celebration).
- **Keyboard:** Send test reachable; ⌘K offers "Send test request" on the starter.
- **No signup wall** at any point (principle 8).
- **Idempotent auto-create:** only when the user has **zero** endpoints; never
  creates duplicates on refresh or revisit.
- **Naming:** the starter's random name is editable inline ("Name this endpoint?")
  — optional, never blocking.

## 7. Acceptance criteria

- [ ] A first-time visitor with no endpoints is auto-given a starter endpoint and
  lands on its detail page **without filling any form**.
- [ ] Auto-create fires **only** when the user has zero endpoints (idempotent).
- [ ] The starter detail page shows the URL (copy + copy-as-curl) and a working
  **Send test request** button on first paint.
- [ ] The live stream is on by default; sending a test makes a request appear
  **without a manual refresh**.
- [ ] On the first captured request, a one-time celebration + a single dismissible
  "Save your dashboard" nudge appear; dismissing is permanent for that browser.
- [ ] The optional micro-tour is ≤3 steps, skippable, and never reappears once
  dismissed.
- [ ] Returning anonymous users on the same browser land on their existing data
  with no re-onboarding.
- [ ] TTFC (land → first visible capture via Send test) is < 30s in a manual run.

## 8. Success metrics

- **TTFC p75 < 60s** (target < 30s with Send test).
- **Activation rate ≥ 60%** capture ≥1 request in session 1.
- **Send-test usage:** ≥ 70% of new users click Send test in session 1.
- **Tour skip rate** is fine to be high; **tour-completion correlation** with
  activation is the signal we watch.

## 9. Out of scope

- Persona self-selection ("developer vs non-developer" fork) — single dev path.
- Multi-step product tours / feature tours.
- Sample/demo *dataset* seeding beyond the single Send-test request (provider
  samples live in `05`).

## 10. Open questions

1. Should the **landing page** itself host a live URL (webhook.site-style, before
   reaching the dashboard), or is auto-create-on-dashboard enough? (Lean: dashboard
   auto-create is enough for v1; revisit a landing-page URL if TTFC stalls.)
2. Friendly random names: do we curate a word list for memorability, or reuse the
   existing 8-char slug generator? (Lean: word-pair list — more memorable, on-brand.)
3. Do we keep the starter endpoint or auto-clean it if unused after N days? (Lean:
   keep; retention handles cleanup of its empty request set.)
