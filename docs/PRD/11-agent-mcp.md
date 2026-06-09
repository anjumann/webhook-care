# 11 · Agent & MCP

> **Primary persona:** AI-agent user · **Secondary:** Integration builder
> **Phase:** 3 · **Cites:** `00-prd-overview.md`, `../03-feature-designs.md §3` (agent access),
> `../04-implementation-plan.md §A` (MCP design), `10-settings-api-tokens.md`

---

## 1. Problem & why now

The 2026 differentiator for a webhook tool is being **agent-native**: a developer's
AI agent (Claude, Cursor, etc.) connects and can **fetch and reason over** their
webhooks with zero glue code. MCP is now an expected capability for serious dev
tools, and the connect experience has converged on a **single copy-paste command**.
The technical design is done (`../04-implementation-plan.md §A`, `../03-feature-designs.md §3`);
this PRD owns the **"connect your agent" experience** and the developer-facing REST
surface — making it feel like Stripe/Vercel-grade setup, not a research project.

## 2. Target persona & jobs

- **AI-agent user:** "Paste one command into Claude/Cursor and my agent can list my
  endpoints and read recent requests — read-only, scoped to me."
- **Integration builder (secondary):** "Pull the latest webhook in CI to assert my
  integration fired."

## 3. User stories

- As a user, I can open **Agents & MCP** and get a **one-command** connect snippet
  pre-filled with my server URL + a token I create inline.
- As a user, the connect UI has **tabs per client** (Claude Code / Claude Desktop /
  Cursor / generic JSON).
- As a user, my agent gets typed tools: **list endpoints**, **get requests**
  (filtered/paginated), **get one request** — all **read-only** and scoped to me.
- As a developer, I can also use a **versioned REST API** (`/api/v1/*`) with the
  same token for any HTTP-capable script/agent.
- As a user, I can **revoke** the token and instantly kill agent + REST access.

## 4. Proposed experience

### 4.1 "Connect an agent" surface

```
Agents & MCP
  1. Create a token        [ Create read-only token ]  → reveal once (→10)
  2. Connect your agent
     [ Claude Code ] [ Claude Desktop ] [ Cursor ] [ JSON ]

     claude mcp add --transport http webhook-catcher \
       https://APP/api/mcp --header "Authorization: Bearer wcat_xxx"      [Copy]

  3. Try it
     Ask your agent: "List my webhook endpoints and show the last 5 requests."
  Tools available: list_endpoints · get_requests · get_request   (read-only)
```

- The snippet is **pre-filled** with the real URL and the just-created token
  (Stripe-grade copy-paste, principle 4).
- A generic JSON config tab for any MCP client (`../04-implementation-plan.md §A.6`).
- Inline note: read-only, per-user scoped, revoke anytime.

### 4.2 MCP server (behavior — design in `../04 §A`)

- Remote **Streamable-HTTP** server at `/api/mcp`, Node runtime, raised
  `maxDuration`. Bearer-PAT auth via `withMcpAuth` → resolve token → `requests:read`
  scope → per-token rate limit.
- Tools (all read-only, cursor-paginated, scoped to the token's `userId`):
  `list_endpoints`, `get_requests` (limit/cursor/method/status/since),
  `get_request`. Optional `search_requests` later.
- **Tool-output hygiene:** truncate huge bodies (point to `get_request`), **redact
  secret headers** so tokens never reach the model.

### 4.3 REST API (the universal path)

- Versioned, read-only, token-guarded, cursor-paginated
  (`../03-feature-designs.md §3.2`):
  `GET /api/v1/endpoints`, `GET /api/v1/endpoints/:id/requests`,
  `GET /api/v1/requests/:id`.
- Shares the **same service layer** as MCP and the dashboard — one source of truth
  for auth/pagination/filtering.
- A short **REST quickstart** (curl example) sits beside the MCP tabs.

### 4.4 Safety model

- **Read-only** scopes only; no delete/replay (write scopes explicitly future).
- Strict **per-`userId`** scoping — an agent can never see another user's data.
- Per-token **rate limiting** + **last-used** audit; **instant revoke** (`10`).
- Gated behind a **claimed account** (tokens require claim, `09`/`10`).

## 5. DX details — states

| State | Behavior |
|-------|----------|
| **No token yet** | Step 1 prompts token creation inline (→ reveal once). |
| **Token ready** | Snippets populate with URL + token; copy works. |
| **Connected (verified)** | Optional "test connection" runs `list_endpoints` and shows ✓. |
| **Revoked** | Snippets warn the token is revoked; calls 401. |
| **Anonymous** | Gated with inline claim prompt (`09`). |

- **Validation aid:** mention **MCP Inspector** (`npx @modelcontextprotocol/inspector`)
  for power users (`../04 §A.7`).
- **A11y/copy:** every snippet one-click copy; tabs keyboard-navigable.

## 6. Acceptance criteria

- [ ] The Agents & MCP page lets a user create a read-only token and shows a
  **one-command** connect snippet pre-filled with their URL + token.
- [ ] Client tabs (Claude Code / Desktop / Cursor / JSON) each show correct config.
- [ ] MCP server exposes `list_endpoints`, `get_requests`, `get_request`,
  read-only, scoped per user, rate-limited; secret headers redacted in output.
- [ ] Versioned REST (`/api/v1/*`) works with the same token, cursor-paginated,
  read-only, owner-scoped.
- [ ] Revoking the token kills both MCP and REST access immediately.
- [ ] Feature is gated behind a claimed account.
- [ ] An agent can complete `list_endpoints → get_requests → get_request` against a
  real account in testing.

## 7. Success metrics

- Tokens created + **agent connections verified**.
- MCP tool calls / week (agent engagement).
- Time from "create token" → first successful tool call.
- Zero cross-tenant access in security tests.

## 8. Out of scope

- **OAuth 2.1** "connect by URL" (no pasted token) — Phase-2 enhancement
  (`../04 §A.3`).
- **Write** tools (delete/replay) — future, explicit scope.
- `search_requests` full-text — optional follow-up (needs a search index).

## 9. Open questions

1. Add a **"Test connection"** button in-app that runs `list_endpoints` with the
   new token and confirms ✓? (Lean: yes — closes the setup loop.)
2. Offer a **one-command multi-client installer** (Neon `add-mcp`-style) that
   writes config for detected clients? (Lean: nice future; copy-paste tabs first.)
3. Ship `search_requests` in v1 or defer until the search index exists? (Lean:
   defer; filtered `get_requests` covers most agent needs.)
