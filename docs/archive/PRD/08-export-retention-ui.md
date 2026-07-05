# 08 · Export & Retention UI

> **Primary persona:** Integration builder · **Secondary:** Solo debugger
> **Phase:** 2 · **Cites:** `00-prd-overview.md`, `../02-audit-and-roadmap.md §6` (30-day retention),
> `../03-feature-designs.md §2` (ZIP export), `05-endpoint-detail-inspector.md` (pin), `09-identity-claim.md`

---

## 1. Problem & why now

The **#1 complaint** about the inspector category (webhook.site, RequestBin) is
that **events expire** and you can't take them with you. Our answer is two-fold and
already designed at the architecture level: **30-day retention** (with **pinning**
to keep important requests) and **ZIP export** (take everything with you). This PRD
specs the *user-facing experience* of both — the chips, the pin action, the export
dialog, and the pre-expiry nudge — so retention feels like a helpful feature, not a
silent delete.

## 2. Target persona & jobs

- **Integration builder:** "Keep the requests I care about, export the rest, and
  warn me before anything I need disappears."
- **Solo debugger:** "Let me download a request log to attach to a bug report."

## 3. User stories

- As a user, every request row shows **how long until it expires** ("expires in N
  days"); pinned ones show **"kept"**.
- As a user, I can **pin/unpin** a request; pinned requests are exempt from the
  30-day purge.
- As a user, I can **export** all endpoints, a selected set, or a single endpoint
  as a ZIP — with options for what to include and whether to redact secrets.
- As a **claimed** user, I get a **pre-expiry email** ("your webhooks expire in 3
  days — export them") with a one-click export link.
- As a user with a large dataset, export still works — it streams or is prepared in
  the background and emailed to me.

## 4. Proposed experience

### 4.1 Retention surfaced in the inspector

- **Expiry chip** on each request row: "expires in 27d" (subtle, `dim`); pinned →
  **"kept"** (`accent`).
- **Pin action** in the row + inspector (`p` shortcut, see `05`). Pinned float to
  top.
- **Per-endpoint retention selector** (24h / 7d / 30d; default 30) in endpoint
  settings — sets `Endpoint.retentionDays`, which drives `expiresAt` at capture.
- **Dashboard/endpoint banner** near nothing-alarming: a one-line, dismissible note
  "Requests auto-delete after 30 days. Pin the ones you need." (Not a nag — info.)

### 4.2 Export dialog

```
Export
  Scope:   ( ) All endpoints  (•) Selected  ( ) This endpoint
  Range:   [ All retained ▾ ]   (optional date range)
  Include: [✓] headers  [✓] body  [✓] forwarding config
  Redact secrets:  [✓]  (auth headers, signatures, tokens)
  Format:  (•) NDJSON  ( ) Pretty JSON  ( ) CSV summary
                                   [ Cancel ]  [ Export ]
```

- Archive layout per `../03-feature-designs.md §2.2`: `manifest.json` +
  `endpoints/<name>/{endpoint.json, forwarding.json, requests.ndjson}`.
- **Small exports** stream inline (download starts immediately). **Large exports**
  hand off to a background job → private storage → **emailed signed link**
  ("Preparing your export; we'll email you a link"). Threshold per
  `../03-feature-designs.md §7` (~50 MB / ~10–20k requests).
- **Redaction on by default** so shared exports don't leak secrets.

### 4.3 Gating (ties to `09`)

- Export reveals a user's **entire dataset**, so it's **owner-guarded**. For
  anonymous users, export of the current browser's data works (they own it via
  cookie/ULID); the **emailed** async link and cross-device export require a
  **claimed** identity. The export entry point uses the contextual claim prompt
  when needed (`09`), never a standalone nag.

### 4.4 Pre-expiry nudge (claimed users)

- A scheduled email (Resend, reusing retention infra) a few days before a user's
  oldest unpinned requests expire: "N requests expire in 3 days — export or pin
  them," with a one-click export link. Turns the silent purge into a helpful,
  retention-driving moment (`../03-feature-designs.md §1.6`).

## 5. DX details — states

| State | Behavior |
|-------|----------|
| **Export idle** | Dialog with sensible defaults (this endpoint, redact on, NDJSON). |
| **Export streaming** | Download begins; progress where the platform allows. |
| **Export queued (large)** | "We're preparing your export; we'll email you a link." (requires claim) |
| **Export error** | "Export failed — Retry"; partial files never delivered. |
| **Expiry chips** | Live "expires in N days" / "kept"; update on pin/unpin. |

- **A11y:** chips have text (not color-only); pin is a labeled toggle with state.
- **Honesty:** the retention banner is informational and dismissible, never alarmy.

## 6. Acceptance criteria

- [ ] Every request row shows an accurate **expiry chip**; pinned shows "kept".
- [ ] **Pin/unpin** works and pinned requests survive the retention purge (verified
  against the `08`/retention job behavior).
- [ ] Per-endpoint **retention selector** (24h/7d/30d) sets `retentionDays` and is
  reflected in new captures' `expiresAt`.
- [ ] **Export dialog** supports scope (all/selected/this), range, include toggles,
  redact toggle, and format (NDJSON/JSON/CSV).
- [ ] Small exports stream inline; large exports queue and email a **signed,
  expiring** link.
- [ ] Export is **owner-guarded**; secret redaction defaults on.
- [ ] Claimed users receive a **pre-expiry** export nudge email.

## 7. Success metrics

- Pin usage among integration builders (keeping what matters).
- Export completion rate (small + large).
- Pre-expiry email → export/claim conversion.
- Reduced "my events disappeared" complaints vs the category baseline.

## 8. Out of scope

- **Import** (rehydrate from a ZIP) — designed for later (`../03-feature-designs.md §2.6`),
  not in this PRD.
- Scheduled/automatic recurring exports.
- Custom per-endpoint retention beyond the 24h/7d/30d presets.

## 9. Open questions

1. Default export **format** — NDJSON (streamable, dev-friendly) vs pretty JSON for
   the casual user? (Lean: NDJSON default, JSON & CSV as options — already chosen in
   `../03-feature-designs.md §2.3`.)
2. Should **anonymous** users be allowed inline (sync) export of their own browser
   data with **no claim**? (Lean: yes for sync/inline; claim only for async/emailed
   + cross-device.)
3. Surface a small **"X requests expiring soon"** indicator in-app (not just email)
   for anonymous users who get no email? (Lean: yes — a quiet dashboard chip.)
