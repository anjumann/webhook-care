# 10 · Settings & API Tokens

> **Primary persona:** AI-agent user · **Secondary:** All
> **Phase:** 3 · **Cites:** `00-prd-overview.md` (principle 10 — secrets),
> `../03-feature-designs.md §3.1` (ApiToken), `../01-architecture.md §10` (profile),
> `09-identity-claim.md`, `11-agent-mcp.md`, `12-ai-analysis.md`

---

## 1. Problem & why now

Settings today is just a **profile editor** (name + avatar) with a known avatar
double-prefix bug (`../02-audit §1.1 #9`). With Phase 3 we add two sensitive
surfaces that need a proper home: **API tokens** (for the REST API + MCP) and
**BYOK AI provider keys**. Both are secrets and must follow secret-handling best
practices (reveal-once, encrypted at rest, revocable). This PRD defines the
Settings hub and the token UX; AI keys are specced in `12` but **live here**.

## 2. Target persona & jobs

- **AI-agent user:** "Create a read-only token for my agent, see when it was last
  used, and revoke it instantly if leaked."
- **All:** "Manage my profile, theme, identity, and keys in one predictable place."

## 3. User stories

- As a user, Settings has clear sections: **Profile**, **API tokens**, **AI keys**,
  **Account/Identity**.
- As a user, I can **create an API token**, name it, and see the raw value
  **exactly once** with a clear "you won't see this again" warning and one-click
  copy.
- As a user, I see my tokens by **prefix only** (e.g. `wcat_a1b2…`), with
  **last-used** time, and can **revoke** any instantly.
- As a user, token creation/use is **gated behind a claimed account** (`09`) — these
  expose my data programmatically.
- As a user, I manage **BYOK AI keys** (Groq/OpenAI/Anthropic) here (full UX in `12`).

## 4. Proposed experience

### 4.1 Settings IA

```
Settings
  ▸ Profile        name · avatar (fix double-prefix bug)
  ▸ API tokens     create · list (prefix, scopes, last used) · revoke
  ▸ AI keys        Groq · OpenAI · Anthropic (BYOK, →12)
  ▸ Account        email/claim state · sign out · sign out everywhere (→09)
```

### 4.2 API tokens (reveal-once)

- **Create:** name + scope (read-only defaults: `endpoints:read`, `requests:read`),
  optional expiry. On create, show the **full token once**:
```
Your new token (copy it now — you won't see it again):
  wcat_live_a1b2c3d4e5f6…                      [ Copy ]
  ⚠ Store it securely. We only keep a hash.
```
- **List:** name, **prefix** (`wcat_a1b2…`), scopes, created, **last used**,
  **Revoke**. Never re-reveal the raw value.
- **Format:** `wcat_<random>`, prefixed for instant recognition; `sha256` at rest
  (`../03-feature-designs.md §3.1`).
- **Scopes:** read-only in v1 (no delete/replay); write scopes explicitly future.
- **Revoke** is instant and kills both REST and MCP access (shared hash lookup).

### 4.3 Gating

- The API-tokens and AI-keys sections require a **claimed** identity (`09`). An
  anonymous user sees the section with an inline "claim to unlock" prompt
  (contextual gating, not a nag).

### 4.4 Profile

- Keep name + avatar (radio of `avatarFiles`); **fix** the `useUser` double-prefix
  bug and the `getProfile` trailing-space bug (`../02-audit §1.1 #9`).

## 5. DX details — states

| State | Behavior |
|-------|----------|
| **No tokens** | "Create a token to connect an agent or script." + link to `11`. |
| **Token created** | One-time reveal modal; copy; then list shows prefix only. |
| **Token list** | Prefix, scopes, last-used; revoke with confirm. |
| **Revoked** | Immediately removed; any call with it now 401s. |
| **Anonymous** | Sections gated with inline claim prompt. |

- **Security (principle 10):** reveal-once; hashed at rest; revoke instant;
  last-used audit; rate-limited per token (Upstash).
- **A11y:** the one-time reveal is keyboard-copyable and screen-reader-announced
  ("token shown once").
- **Copy-paste:** one click copies the token; the connect snippets live in `11`.

## 6. Acceptance criteria

- [ ] Settings has Profile, API tokens, AI keys, and Account sections.
- [ ] Token create shows the raw value **once** with a clear warning + copy; it is
  never re-revealed.
- [ ] Tokens are stored as **hashes**, listed by **prefix**, show **last-used**, and
  can be **revoked instantly** (revocation kills REST + MCP).
- [ ] Tokens default to **read-only** scopes; no write scopes available in v1.
- [ ] API-tokens and AI-keys sections are **gated behind a claimed account** with
  contextual (non-nag) prompts.
- [ ] Profile avatar double-prefix and `getProfile` trailing-space bugs are fixed.

## 7. Success metrics

- Tokens created (P3 differentiator traction).
- Time from "create token" → first successful API/MCP call (setup clarity).
- Revocations are rare and fast (security hygiene).

## 8. Out of scope

- Write/delete token scopes (future, explicit).
- Per-token granular resource scoping (endpoint-level) — coarse read scopes v1.
- Team/shared tokens.

## 9. Open questions

1. **Test vs live** token separation (Stripe-style `wcat_test_`/`wcat_live_`) — do
   we need it in an all-free single-env product? (Lean: single live prefix v1; keep
   the prefix slot for future.)
2. Token **expiry defaults** — none, 90d, or user-choice? (Lean: optional, default
   none, with a recommendation to set one.)
