# 04 · Create / Edit Endpoint

> **Primary persona:** Integration builder · **Secondary:** Solo debugger
> **Phase:** 1 · **Cites:** `00-prd-overview.md`, `../01-architecture.md §9`,
> `02-onboarding-activation.md` (auto-create), `06-custom-responses.md`,
> `07-forwarding-integrations.md`, `../02-audit §1.1 #7` (non-atomic edit bug)

---

## 1. Problem & why now

The create/edit form (`src/endpoints/endpoint-edit-form.tsx`) is functional but
plain: it's a mandatory gate before any value (which `02` fixes via auto-create),
its **edit path is a non-atomic delete-then-recreate** of forwarding URLs (data-loss
risk — `../02-audit §1.1 #7`), and it has no ownership check. With auto-create
handling first-run, this form's job shifts to **deliberate, confident endpoint
configuration** for integration builders: name it, describe it, set forwarding/
integration targets, and (P2) custom responses.

## 2. Target persona & jobs

- **Integration builder:** "Create a named endpoint for this provider and wire its
  forwarding/integrations correctly, the first time."
- **Solo debugger (secondary):** "Rename or tweak the starter endpoint without
  ceremony."

## 3. User stories

- As a user, I can create an endpoint with a valid name and optional description.
- As a user, I can add forwarding/integration **targets** (raw URL / Slack /
  Telegram / Discord) right here (full spec in `07`).
- As a user editing an endpoint, my existing forwarding targets are **never lost**
  if the save partially fails.
- As a user, I get instant inline validation (name rules, URL validity) and a
  one-click random name.
- As a user, after creating I land on the endpoint detail page ready to send a test.

## 4. Current-state gaps

- **Mandatory** before first value (fixed by `02` auto-create; form stays for
  deliberate use).
- **Non-atomic edit:** `PUT /api/endpoints/[id]` does `forwardingUrl.deleteMany`
  then recreate — if the second step fails, targets are gone. Must become atomic
  (transaction) and **ownership-checked** (`requireOwner`).
- No type on forwarding targets (all raw URLs) — `07` adds a `type`.
- Name validation exists (3–50, `[a-zA-Z0-9_-]`) but the URL preview of the final
  webhook address isn't shown live.

## 5. Proposed experience

### 5.1 Layout (two-column, from the Emerald reference)

```
┌───────────────────────────────┬───────────────────────┐
│ Name  [ swift-otter ] ✦random │  Live preview          │
│ Description [           ]      │   URL: …/swift-otter   │
│                                │   [Copy] [curl]        │
│ Forwarding & Integrations      │                        │
│  ▸ [Slack ▾]  #alerts   ✕      │  Tips / what happens   │
│  ▸ [raw ▾]  https://localhost  │  next                  │
│  + Add target                  │                        │
│ ───────────────────────────    │                        │
│ Custom response (P2 →06)       │                        │
│         [ Cancel ] [ Save ]    │                        │
└───────────────────────────────┴───────────────────────┘
```

### 5.2 Fields

- **Name** — 3–50 chars, `[a-zA-Z0-9_-]`, no `/`; **live-sanitized** with a hint
  ("spaces become -"); **✦ random** generates a memorable name (word-pair list).
- **Description** — optional, ≤1000 chars.
- **Forwarding & Integration targets** — a single list where each row has a
  **type** (raw URL / Slack / Telegram / Discord) and type-appropriate fields;
  full behavior, formatting, and setup guides in `07`. (Method per target stays,
  with the known caveat that ingest currently forwards the *incoming* method —
  `../01-architecture.md §4.3`.)
- **Custom response** — collapsed section linking to `06` (P2); v1 shows the
  default (200 + ack body) read-only.

### 5.3 Live preview panel

- Shows the **final webhook URL** as the user types the name, with copy +
  copy-as-curl, so the result is concrete before saving.
- A short "what happens next" tip (you'll land on the detail page; send a test).

### 5.4 Create vs Edit

- **Create:** `POST /api/endpoints` → route to detail with `?isNew=true`
  (auto-opens integration section, per today).
- **Edit:** load current values (`form.reset`), and **save atomically** — wrap
  target changes in a transaction (upsert/diff rather than delete-all-recreate) so
  a partial failure never drops targets. **Ownership-checked** via `requireOwner`.

## 6. DX details — states

| State | Behavior |
|-------|----------|
| **Empty/new** | Clean form, name focused, random-name affordance visible. |
| **Validating** | Inline per-field errors; Save disabled until valid; URL fields validated as URLs. |
| **Saving** | Optimistic; button shows progress; on success route to detail. |
| **Error** | Plain-language error (e.g. "Name already in use"); **no data loss** — form state preserved. |
| **Edit load** | Skeleton while fetching; populated via `form.reset`. |

- **Keyboard:** ⌘↵ saves; Esc cancels with a guard if dirty.
- **A11y:** every field labeled; errors associated via `aria-describedby`.
- **Duplicate names** per user are rejected with a clear message (and a suggested
  alternative).

## 7. Acceptance criteria

- [ ] Create produces a valid endpoint and routes to its detail page with the
  integration section open.
- [ ] Name is live-sanitized and validated (3–50, allowed charset); random-name
  button works and yields memorable names.
- [ ] The live preview shows the exact final webhook URL with copy + copy-as-curl.
- [ ] Forwarding/integration targets support a **type** selector (raw/Slack/
  Telegram/Discord) per `07`.
- [ ] **Edit saves atomically** — a simulated mid-save failure leaves existing
  forwarding targets intact.
- [ ] Create and edit both enforce **ownership** (`requireOwner`); a non-owner is
  rejected.
- [ ] Duplicate endpoint name for the same user is rejected with a helpful message.
- [ ] All states in §6 implemented; ⌘↵ saves.

## 8. Success metrics

- 0 forwarding-target data-loss incidents on edit (was a real risk).
- ≥ 95% of create attempts succeed first try (validation clarity).
- Median time-to-create (deliberate, with forwarding) under ~60s.

## 9. Out of scope

- Conditional forwarding rules / transformations (`07` is fire-and-forget v1).
- Custom-response rules engine (`06` is static v1).
- Bulk endpoint creation / import (export/import lives in `08`).

## 10. Open questions

1. Should **method-per-target** finally be honored at forward time (fixing the
   `../01-architecture §4.3` caveat), or stay informational? (Lean: honor it in the
   `07` work — it's a small, correct fix.)
2. Inline **"test this target"** button when adding a Slack/Telegram destination,
   to confirm the token works before saving? (Lean: yes — big confidence win.)
