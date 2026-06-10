# Build Progress

Consolidated tracker across the three planned workstreams:

- **Backend roadmap** — `04-implementation-plan.md` (B.0–B.7). **Done.**
- **DX PRD set** — `PRD/00`–`15` (the user-facing experience). **Partly done.**
- **UI redesign** — `UI redesign/` (Emerald Console re-skin). **Partly done.**

`[x]` done & verified · `[~]` partial · `[ ]` not started.

_Last updated: 2026-06-11._

---

## ⏳ Pending at a glance

**Ops (infra):**
- [ ] **Upstash Redis** (`UPSTASH_REDIS_REST_URL`/`_TOKEN`) — rate limiting is wired but no-op until set. Also activates per-token REST/MCP limits.
- [ ] Rotate QStash signing keys (leaked into a session transcript on 2026-06-11).

**Biggest user-facing gaps (DX PRD, not yet built):**
- [ ] **Live SSE request stream** (PRD 05 / UI Ph4) — the core "watch it land live" loop. No SSE route exists; the inspector doesn't auto-update.
- [ ] **Inspector power tools** (PRD 05): copy-as-curl, code snippets, provider samples, **replay**, **type-gen** (TS/JSON-Schema/Zod). *Currently these exist only as marketing mockups.*
- [ ] **Detail-page pagination ("load more") + server-side search** — backend cursors exist; UI doesn't use them.
- [ ] **Custom responses** (PRD 06) — static status/body/headers/delay. No schema, not built.
- [ ] **Typed forwarding integrations** (PRD 07) — Slack/Telegram/Discord targets + Integrations section. Only raw-URL fire-and-forget exists today.
- [ ] **AI payload analysis** (PRD 12) — BYOK Groq/OpenAI/Anthropic. `GROQ_API_KEY` is set but no feature wired.
- [ ] **Onboarding / 1-click first-run** (PRD 02).
- [ ] **Responsive / mobile** (PRD 15) — no sidebar drawer, no table→card collapse.

**UI redesign remainder:** detail / create-edit / playground / profile screens still render pre-redesign markup; shadcn primitives not restyled; marketing header/home not re-skinned; a11y pass pending.

**Deferred / Phase-2 (intentional):** pre-expiry export email · async large export (Blob) · OAuth 2.1 for MCP · `search_requests` tool · API-client saved history · startup env validation · E2E auth-flow test.

---

## A. Backend roadmap — `04-implementation-plan.md` ✅

All of B.0–B.7 complete (tsc + `npm test` (105) + build green). Condensed:

- [x] **B.0 Foundations** — service layer, Zod-validated thin routes, `lib/{http,redact,ratelimit,api-token,auth}`, cursor pagination, Prisma hygiene, shared `types.ts`, known-bug fixes. Redaction also scrubs Vercel infra creds + `forwarded` `sig=`.
- [x] **B.1 Retention** — `expiresAt`/`pinned`/`rawBody`, QStash-signed sweep, Mongo TTL net, dry-run, expiry/pin UI. **Cron live** (`scd_5R74…`, `0 0 * * *`) — env set in prod, verified end-to-end (signed dry-run → 200) on 2026-06-11.
- [x] **B.2 Identity** — magic-link/sessions/merge, partial-unique `email` index, `requireOwner` on all management routes, global 401→sign-in, domain-resolved magic links. `APP_URL` set in prod.
- [x] **B.3 ZIP export** — owner-guarded streaming ZIP, redact toggle, multi-select dialog. Smoke-tested.
- [x] **B.4 Agent REST** — `ApiToken`, `/api/v1/*` scoped + cursor-paginated, token CRUD + UI. Isolation smoke-tested.
- [x] **B.5 MCP server** — `/api/mcp` (Streamable HTTP), `list_endpoints`/`get_requests`/`get_request`, shared service layer, auth via PAT. Isolation + unit tested.
- [x] **B.6 API client** — `/api-client` + SSRF-guarded `POST /api/tools/http` (DNS re-check). Tested.
- [x] **B.7 PWA** — manifest + app-shell SW + install prompt.

**Residual (deferred):** pre-expiry export email (B.2) · async export → Blob (B.3) · per-token rate limits (gated on Upstash) · startup env validation · E2E auth-flow browser test.

---

## B. DX PRD set — `PRD/00`–`15`

| # | PRD | Phase | Status |
|---|-----|-------|--------|
| 01 | Sidebar & Shell + ⌘K palette | 1 | [x] built (console shell + `command-palette.tsx`) |
| 02 | Onboarding & Activation (1-click first-run) | 1 | [ ] not built |
| 03 | Dashboard (real-KPI endpoints list) | 1 | [x] built (UI redesign Ph3 §1) |
| 04 | Create / Edit Endpoint | 1 | [~] works + owner-checked; **not re-skinned**; atomic-edit unverified; no integration type selector |
| 05 | Endpoint Detail & Inspector | 1 | [~] basic detail only. **Missing:** live SSE, copy-as-curl, snippets, provider samples, replay, type-gen, master-detail inspector, pagination/search UI |
| 06 | Custom Responses | 2 | [ ] not built (no schema) |
| 07 | Forwarding & Integrations (typed targets) | 2 | [~] raw-URL fire-and-forget only; Slack/Telegram/Discord + catalog + Integrations nav **not built** |
| 08 | Export & Retention UI | 2 | [x] built (B.1/B.3) |
| 09 | Identity & Claim | 2 | [x] built (B.2) |
| 10 | Settings & API Tokens | 3 | [x] built (B.4); **AI-keys panel** (ties to 12) not built |
| 11 | Agent & MCP | 3 | [x] built (B.5) |
| 12 | AI Payload Analysis (BYOK) | 3 | [ ] not built (`GROQ_API_KEY` set, no feature) |
| 13 | API Client (minimal) | 3 | [x] built (B.6) |
| 14 | PWA / Installable | 3 | [x] built (B.7) |
| 15 | Responsive & Mobile | All | [ ] not built (no drawer / table→card) |

---

## C. UI redesign — `UI redesign/03-implementation-plan.md`

- [x] **Phase 0 — Foundation** — emerald tokens, fonts (Hanken/JetBrains), helpers.
- [x] **Phase 1 — Shell** — sidebar + topbar + ⌘K + account footer; dashboard on the console.
- [~] **Phase 2 — Core components** — done: panel/kpi/segments/pills/chip/service-logo/env-pill, **`code-block`** (copy-button code block, used on the tokens page). **Pending:** `live-tag`, restyled shadcn primitives (button/input/table/tabs…), `kv-editor`/`kv-list`, `json-view`, `area-chart`, rest of aside set (`url-box`/`forward-result`…).

**DX wins shipped (2026-06-11):**
- API-tokens page now injects the freshly-created token (+ a real endpoint id) into the REST/MCP snippets and makes every snippet one-click copyable via `CodeBlock`.
- **Dashboard re-skin** — colorful hero header band + copyable **webhook base URL** (`webhook-base-url.tsx`); 4th "Forwarding" KPI; endpoint search/filter box; relative "last activity" + live-pulse dot for recently-active endpoints (`formatRelative`/`isRecent` in `lib/utils`, unit-tested); per-row **copy test curl** + copy-URL DX actions; more whitespace + aligned columns (dropped the redundant "Created" column).
- [~] **Phase 3 — Screens** — done: Endpoints list (re-skinned 2026-06-11). **Pending:** Create/Edit, Detail, Playground, Profile (still pre-redesign markup inside the new shell).
- [ ] **Phase 4 — Live & inspector** — request inspector (master-detail), live SSE stream, forwarding section. *(Overlaps PRD 05/07.)*
- [~] **Phase 5 — Polish** — done: footer re-skin. **Pending:** marketing header + home sections re-skin, accessibility (icon+text, focus mgmt, ARIA live), mobile drawer/cards, settings hub scaffolding.
</content>
</invoke>
