# 00 · PRD Overview — Developer Experience

> The north-star for the Webhook Catcher PRD set. This doc defines **who we
> build for**, **the DX bar every screen must clear**, **how the section PRDs are
> organized**, and **the delivery phasing**. Every section PRD (`01`–`14`) cites
> this doc instead of restating it.
>
> **Relationship to the existing docs:** This `PRD/` folder is the **DX layer** on
> top of the product/architecture docs in `../00`–`../04` and the visual system in
> `../UI redesign/`. It does **not** restate architecture or re-spec tokens — it
> specs the *experience*: flows, states, acceptance criteria, and metrics. Where a
> decision here changes scope, it says so explicitly and links the source doc.

---

## 1. Goal

> **Make the developer experience as good as it gets for a webhook tool.**

Concretely: a developer should be able to land, get a working endpoint, send a
webhook, and watch it arrive **live** in well under a minute — then stay because
the tool is fast, honest, keyboard-driven, and quietly powerful (search,
forwarding, integrations, agent access, AI explainability) without ever feeling
heavy.

We benchmark against the tools developers already love — **webhook.site,
Hookdeck, RequestBin, ngrok, Stripe, Linear, Vercel, Resend** — and adopt the
patterns that make them loved while avoiding the things that make them tolerated
(event expiry, dead-end inspectors, no copy-paste, no live updates, signup walls).

---

## 2. Personas (layered, in priority order)

Each section PRD tags a **primary** and **secondary** persona. The product serves
all three, layered:

| # | Persona | Role in the product | Optimize for |
|---|---------|--------------------|--------------|
| **P1** | **Solo debugger** | The **front door** — most traffic. Just needs to point a webhook at a URL, watch it land, inspect it, move on. | Time-to-first-capture, zero friction, get-out-of-the-way, keyboard-first, copy-as-curl, replay. |
| **P2** | **Integration builder** | The **retention engine** — lives in the tool across days wiring Stripe/GitHub/Shopify. | Recoverable identity, durable + searchable history, forwarding & integrations, provider samples, pinning, custom responses. |
| **P3** | **AI-agent / automation user** | The **differentiator** — connects agents and pulls webhooks programmatically. | First-class API tokens, MCP "connect your agent", read-only safety, AI payload analysis. |

**Design rule:** never let P2/P3 surface area slow down the P1 front door. Power
lives one keystroke or one click deeper, never in the activation path.

---

## 3. DX principles (the bar every PRD must clear)

These are the reusable acceptance bar. Section PRDs reference them by number.

1. **Time-to-first-value < 60s.** First visit → working endpoint → first request
   visible, with no form required to start (`02-onboarding-activation`).
2. **The core loop is live.** New requests appear in real time (SSE), never behind
   a manual Refresh button. Live/Paused toggle; arrival animation
   (`05-endpoint-detail-inspector`).
3. **Honest UI only.** No fake metrics, no "To be implemented", no dead buttons.
   If we can't measure it truthfully, we don't show it (`03-dashboard`).
4. **Copy-paste that just works.** Every URL, curl, snippet, and token is
   one-click copyable and pre-filled with the user's real values (Stripe-grade).
5. **Keyboard-first.** ⌘K command palette for every primary action; arrow-key
   navigation in lists; visible shortcuts (`01-sidebar-shell`).
6. **Optimistic & fast.** Mutations reflect immediately (Linear-grade); skeletons,
   not spinners; sub-100ms perceived interactions.
7. **Every screen has four states.** Empty (teaches the next action), loading
   (skeleton), error (recoverable, plain-language), populated. PRDs spec all four.
8. **Anonymous-first, never lose data silently.** Zero-friction anonymous start;
   one gentle post-activation nudge to claim; otherwise contextual gating only
   (`09-identity-claim`).
9. **Accessible by default.** Status conveyed by icon+text not color alone; focus
   management on expand/dialog; ARIA live region for the live request stream.
10. **Secrets are handled like secrets.** Redact sensitive headers in display,
    export, and AI/agent output; reveal-once tokens; BYOK keys encrypted at rest
    for claimed users only.
11. **Mobile is usable, not an afterthought.** Tables collapse to cards; primary
    actions stay thumb-reachable. We're honest that webhook tooling is
    desktop-shaped, so we set a **tiered bar**: the core inspect loop is
    first-class on mobile; authoring-heavy flows are merely usable. Full rules in
    `15-responsive-mobile.md`.
12. **Dark mode is the default**, light fully supported; choice persisted.

---

## 4. The PRD set

| # | PRD | Surface | Primary persona | Phase |
|---|-----|---------|-----------------|-------|
| 01 | [Sidebar & Shell](./01-sidebar-shell.md) | Nav, topbar, ⌘K palette | All | P1 |
| 02 | [Onboarding & Activation](./02-onboarding-activation.md) | First-run, 1-click create | Solo debugger | P1 |
| 03 | [Dashboard](./03-dashboard.md) | Endpoints list + KPIs | Solo debugger | P1 |
| 04 | [Create / Edit Endpoint](./04-create-endpoint.md) | Endpoint form | Integration builder | P1 |
| 05 | [Endpoint Detail & Inspector](./05-endpoint-detail-inspector.md) | Live stream, payload viewer, curl/snippets, samples, type-gen, replay, pin | Solo debugger | P1 |
| 06 | [Custom Responses](./06-custom-responses.md) | Per-endpoint response config | Integration builder | P2 |
| 07 | [Forwarding & Integrations](./07-forwarding-integrations.md) | Typed targets (raw/Slack/Telegram/Discord) + catalog | Integration builder | P2 |
| 08 | [Export & Retention UI](./08-export-retention-ui.md) | ZIP export, expiry chips, pinning | Integration builder | P2 |
| 09 | [Identity & Claim](./09-identity-claim.md) | Magic-link claim, sessions, merge | All | P2 |
| 10 | [Settings & API Tokens](./10-settings-api-tokens.md) | Profile, tokens (reveal-once), AI keys | AI-agent user | P3 |
| 11 | [Agent & MCP](./11-agent-mcp.md) | Connect-your-agent, MCP, REST | AI-agent user | P3 |
| 12 | [AI Payload Analysis](./12-ai-analysis.md) | BYOK explain/why-failed/summarize | AI-agent user | P3 |
| 13 | [API Client](./13-api-client.md) | Standalone request composer | Integration builder | P3 |
| 14 | [PWA / Installable](./14-pwa.md) | Install, app-shell offline | All | P3 |
| 15 | [Responsive & Mobile](./15-responsive-mobile.md) | Cross-cutting tiered mobile bar | All | All |

---

## 5. Phasing (DX-first)

We front-load the **visible DX wins** so the product *feels* great early, then
layer trust/retention, then the differentiating extensions. (This re-orders the
engineering roadmap in `../02-audit-and-roadmap.md §8`, which is safety-first; the
shared foundations — authz guards, rate limiting, pagination, service layer —
still land underneath P1 as enablers, see `../04-implementation-plan.md §B.0`.)

### Phase 1 — Activation & core loop
`01 Sidebar/Shell` · `02 Onboarding` · `03 Dashboard` · `04 Create endpoint` ·
`05 Endpoint detail + live SSE + copy-as-curl/snippets + provider samples`.
**Outcome:** a developer lands, captures a webhook live in <60s, and inspects it
beautifully. This alone makes us competitive with webhook.site.

### Phase 2 — Trust & retain
`09 Identity/claim` · `08 Export & retention UI` · `06 Custom responses` ·
`07 Forwarding & integrations`.
**Outcome:** developers can keep, recover, alert on, and shape their data — the
retention story that the inspectors lack.

### Phase 3 — Extend & differentiate
`13 API client` · `10 Settings & API tokens` · `11 Agent/MCP` · `12 AI analysis`
· `05 type-gen` · `14 PWA`.
**Outcome:** the 2026 differentiators — agent-native access and AI explainability.

> **Enablers underneath P1 (not user-facing, from `../04 §B.0`):** service layer,
> `requireOwner` authz on management routes, Upstash rate limiting, request
> pagination, type consolidation, the known-bug fixes. PRDs assume these land as
> part of building P1.

---

## 6. Locked defaults (decided during PRD grilling)

These were resolved up front so the section PRDs stay consistent:

- **Command palette** (⌘K, `cmdk` — already a dependency) is **in scope** (`01`).
- **Type-gen** outputs **TypeScript + JSON Schema + Zod** (`05`).
- **Custom responses** = **static per-endpoint** (status / body / headers / delay);
  **no conditional rules engine** in v1 (`06`).
- **Integrations** = **typed forwarding targets** (raw URL / Slack / Telegram /
  Discord) folded into the existing forwarding list, plus a light global catalog;
  fire-and-forget in v1 (`07`).
- **AI analysis** = **BYOK**, providers **Groq / OpenAI / Anthropic only**, with
  in-app key-creation guides (Groq's free tier highlighted); keys **encrypted
  server-side for claimed users**, anonymous users paste per-session (`12`).
- **API client** = **minimal, no saved history** in v1 (`13`).
- **PWA** = **app-shell only** offline (`14`).
- **CLI `listen`** (forward captured requests to localhost) is **out of scope /
  future** — documented as a future idea here, not specced.

---

## 7. Success metrics (product-level)

| Metric | Target | Why |
|--------|--------|-----|
| **Time-to-first-capture (TTFC)** | p75 < 60s from first landing | Core activation; the single most important number. |
| **Activation rate** | ≥ 60% of new visitors capture ≥1 real request in session 1 | The "aha" happened. |
| **Live-stream adoption** | ≥ 80% of detail-page sessions keep Live on | Validates the core-loop bet. |
| **Copy actions / active user** | trending up | Copy-as-curl/snippets are getting used. |
| **Claim rate (of returning users)** | ≥ 25% | Retention + recoverability. |
| **Day-7 retention (claimed)** | ≥ 40% | Integration-builder stickiness. |
| **Agent connections (tokens created)** | growing | P3 differentiator traction. |

Per-PRD metrics specialize these.

---

## 8. Out of scope (whole-program)

- Paid tiers / monetization — **all-free** (`../00-product-overview.md`).
- Durable/observable forwarding with delivery records — **deferred**; integrations
  & forwarding stay fire-and-forget in v1 (`07`).
- CLI `listen` tool, OAuth for MCP, full Postman-class API client, payload
  transformation/scripting (webhook.site Custom Actions–style) — **future**.

---

## 9. Open questions (program-level)

1. **Global Integrations page depth** — is it just a catalog + reusable connection
   credentials, or does it also list active destinations across all endpoints?
   (`07` proposes catalog + reusable creds; revisit if users want a cross-endpoint
   view.)
2. **Type-gen surface** — inline in the inspector vs. a dedicated "Types" tab per
   endpoint that aggregates a schema across all captured payloads. (`05`)
3. **AI cost guardrails** — even BYOK, do we cap tokens/size per call to protect
   the user's spend? (`12` recommends yes.)
