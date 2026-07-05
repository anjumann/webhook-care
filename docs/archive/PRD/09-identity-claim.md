# 09 · Identity & Claim (Magic-Link)

> **Primary persona:** All · **Secondary:** Integration builder
> **Phase:** 2 · **Cites:** `00-prd-overview.md` (principle 8), `../01-architecture.md §3` (anonymous ULID),
> `../02-audit-and-roadmap.md §1.1 #1, §3` (authz), `../03-feature-designs.md §1` (magic-link design)

---

## 1. Problem & why now

Identity today is a **ULID in `localStorage`** — clear your browser, switch
devices, or use incognito, and your data is **orphaned forever**. Worse, there's
**no authorization**: any caller can read/delete anyone's data by guessing a
`userId` (`../02-audit §1.1 #1`). We need recoverable identity **without** breaking
the zero-friction anonymous start, and we need it before export/tokens/AI-keys
expose a user's full dataset. The full technical design exists
(`../03-feature-designs.md §1`); this PRD owns the **experience**: how claiming
feels, when we prompt, and how merge is presented.

## 2. Decision (locked)

- **Anonymous-first stays.** New visitors get a ULID + working dashboard, zero
  friction.
- **Claiming is optional, passwordless** (magic-link via Resend), and **reversible**.
- **Prompt model:** **one** gentle post-activation nudge + **contextual gating**
  only. No standing banner, no repeated nags (principle 8).
- **Claiming gates:** ZIP **async/emailed** export & cross-device export (`08`),
  **API tokens** & **MCP** (`10`,`11`), and **persistent AI keys** (`12`).

## 3. User stories

- As an anonymous user, I'm never forced to sign up to use the core product.
- After my **first captured request**, I see **one** dismissible "Save your
  dashboard" nudge; if I dismiss it, I'm not asked again.
- When I try a gated action (export-async / create token / save AI key), I get an
  inline "claim via email to unlock" prompt right there.
- I claim by entering my email and clicking a link — no password.
- If my email already has data on another device, I'm clearly asked whether to
  **merge this browser's endpoints** into my account.
- I can sign in on a new device and see the same data; I can **sign out
  everywhere**.

## 4. Proposed experience

### 4.1 The single post-activation nudge

Triggered once, on the **first captured request** (the `02` aha moment):
```
✨ First request captured!
   Save your dashboard so you never lose it.   [ Save → ]   [ Dismiss ]
```
- Dismiss is **permanent for that browser** (stored locally + server flag once
  known). Never re-shown.

### 4.2 Contextual gating

At each gated action, an inline prompt (not a modal wall):
```
Export to email / Create API token / Save AI key
  └─ "Claim your dashboard via email to unlock this."  [ Enter email ]
```

### 4.3 Claim flow (magic-link)

```
1. Enter email → POST /api/auth/magic-link
     • rate-limited (Upstash) per email + IP
     • always responds "check your email" (no account enumeration)
2. Email link → /auth/verify?token=…
     • single-use, 15-min TTL, sha256 at rest, constant-time compare
     • sets User.email + emailVerifiedAt, creates a signed HttpOnly session
     • handles MERGE (§4.4)
     • redirect to dashboard
```
- The `/auth/verify` landing page handles success, expired, and already-used token
  states gracefully.

### 4.4 Merge (cross-device)

When the claimed email already maps to a different ULID:
- **Adopt (default):** the email owns one canonical `userId`; the session points
  there. We **offer to import** this browser's anonymous endpoints into the account:
```
We found an existing account for alice@example.com.
Move this browser's 2 endpoints into it?   [ Move & merge ]  [ Keep separate ]
```
- Make it explicit and reversible-feeling; never silently lose either side.

### 4.5 Account area (in the sidebar footer, `01`)

- Anonymous: chip "Anonymous" + "Claim your dashboard".
- Claimed: email/avatar + menu → Settings, **Sign out**, **Sign out everywhere**
  (server-side session revocation via the `Session` table).

### 4.6 Authorization (the security payoff)

- Every management route (`/api/endpoints*`, `/api/requests*`, `/api/user*`,
  `/api/export*`, token routes) calls **`requireOwner`** — ownership proven by the
  signed session/cookie, not by knowing the URL. The **public webhook ingest stays
  open** (that's the point). This closes the `../02-audit §1.1 #1` hole.

## 5. DX details — states

| State | Behavior |
|-------|----------|
| **Anonymous** | Full product; footer offers claim; one post-activation nudge max. |
| **Magic-link sent** | "Check your email" (uniform, no enumeration). |
| **Verify success** | Session set; merge offered if applicable; land on dashboard. |
| **Verify expired/used** | "This link expired — request a new one." |
| **Claimed** | Email shown; cross-device works; sign-out-everywhere available. |
| **Gated action, anonymous** | Inline claim prompt at the action site. |

- **Security:** single-use tokens, 15-min TTL, hashed at rest, rate-limited;
  cookies HttpOnly/Secure/SameSite=Lax/signed; sliding 30-day session with
  server-side revocation.
- **A11y:** email field labeled; verify states announced.
- **Anti-nag guarantee:** at most one proactive prompt, ever, per browser.

## 6. Acceptance criteria

- [ ] Anonymous users can do everything except the gated actions, with **no forced
  signup**.
- [ ] Exactly **one** post-activation claim nudge appears (on first capture) and
  never reappears once dismissed.
- [ ] Gated actions (async export, token create, AI-key save) show an inline claim
  prompt; nothing else nags.
- [ ] Magic-link flow works end-to-end: send (uniform response, rate-limited) →
  verify (single-use, expiring, hashed) → signed session cookie.
- [ ] Cross-device sign-in shows the same data; **merge** prompt appears when an
  email maps to a different ULID and import works.
- [ ] **All management routes enforce `requireOwner`**; a non-owner request is
  rejected (closes the authz hole).
- [ ] Sign out and **sign out everywhere** (session revocation) work.

## 7. Success metrics

- **Claim rate ≥ 25%** of returning users.
- **Day-7 retention (claimed) ≥ 40%.**
- Nudge dismiss-without-claim rate (watch for annoyance; should be low-impact).
- Zero cross-tenant data-access incidents post-authz.

## 8. Out of scope

- Passwords, OAuth social login (passwordless magic-link only v1).
- Teams / shared dashboards (all-free, single-user model).
- Account deletion automation (manual/support v1; design later).

## 9. Open questions

1. **Merge default** — adopt & import (recommended) is locked; confirm the import
   is **opt-in** per browser, not automatic. (Lean: opt-in, shown explicitly.)
2. Should we let claimed users **add multiple emails** or change email? (Lean:
   single email v1; change-email later.)
3. Do we **server-record** the nudge-dismissed flag (so it survives a localStorage
   clear for claimed users), or local-only? (Lean: local for anonymous; server flag
   once claimed.)
