# Webhook Catcher — Product Requirements (DX Layer)

This folder is the **developer-experience PRD set**: one full PRD per surface,
specifying the *experience* (flows, states, acceptance criteria, metrics) on top of
the existing product/architecture docs (`../00`–`../04`) and the visual system
(`../UI redesign/`). It does **not** restate architecture or re-spec tokens.

> **Start at [`00-prd-overview.md`](./00-prd-overview.md)** — it holds the
> north-star, personas, the DX principles every PRD cites, the phasing, and the
> locked defaults. Every other doc references it.

## North-star

**Make the developer experience as good as it gets for a webhook tool** — land,
get a working endpoint, send a webhook, watch it land **live** in under a minute,
then stay because the tool is fast, honest, keyboard-driven, and quietly powerful.

## Personas (layered)

1. **Solo debugger** — the front door (activation).
2. **Integration builder** — the retention engine.
3. **AI-agent / automation user** — the differentiator.

## The PRDs

| # | PRD | Surface | Phase |
|---|-----|---------|-------|
| 00 | [Overview & DX principles](./00-prd-overview.md) | North-star, personas, principles, phasing | — |
| 01 | [Sidebar & Shell](./01-sidebar-shell.md) | Nav, topbar, ⌘K palette | 1 |
| 02 | [Onboarding & Activation](./02-onboarding-activation.md) | 1-click create-first, first capture | 1 |
| 03 | [Dashboard](./03-dashboard.md) | Endpoints list + truthful KPIs | 1 |
| 04 | [Create / Edit Endpoint](./04-create-endpoint.md) | Endpoint form (atomic, owner-checked) | 1 |
| 05 | [Endpoint Detail & Inspector](./05-endpoint-detail-inspector.md) | Live SSE, payload viewer, copy-as-curl/snippets, provider samples, replay, pin, type-gen | 1 (type-gen 3) |
| 06 | [Custom Responses](./06-custom-responses.md) | Static status/body/headers/delay | 2 |
| 07 | [Forwarding & Integrations](./07-forwarding-integrations.md) | Typed targets (raw/Slack/Telegram/Discord) + catalog | 2 |
| 08 | [Export & Retention UI](./08-export-retention-ui.md) | ZIP export, expiry chips, pinning | 2 |
| 09 | [Identity & Claim](./09-identity-claim.md) | Magic-link, sessions, merge, authz | 2 |
| 10 | [Settings & API Tokens](./10-settings-api-tokens.md) | Profile, reveal-once tokens, AI keys | 3 |
| 11 | [Agent & MCP](./11-agent-mcp.md) | Connect-your-agent, MCP, REST | 3 |
| 12 | [AI Payload Analysis](./12-ai-analysis.md) | BYOK (Groq/OpenAI/Anthropic) + key guides | 3 |
| 13 | [API Client](./13-api-client.md) | Standalone request composer (minimal) | 3 |
| 14 | [PWA / Installable](./14-pwa.md) | Install + app-shell offline | 3 |
| 15 | [Responsive & Mobile](./15-responsive-mobile.md) | Cross-cutting tiered mobile bar (core loop first-class; authoring desktop-recommended) | All |

## Phasing (DX-first)

- **Phase 1 — Activation & core loop:** 01, 02, 03, 04, 05 (live SSE + copy-as-curl
  + snippets + provider samples). *Outcome: capture a webhook live in <60s.*
- **Phase 2 — Trust & retain:** 09, 08, 06, 07. *Outcome: keep, recover, alert on,
  and shape your data.*
- **Phase 3 — Extend & differentiate:** 13, 10, 11, 12, 05 type-gen, 14. *Outcome:
  agent-native access + AI explainability.*

> Shared engineering enablers (authz `requireOwner`, rate limiting, pagination,
> service layer, type consolidation, known-bug fixes) land underneath Phase 1 —
> see `../04-implementation-plan.md §B.0`.

## Locked defaults

Personas layered · ⌘K palette in scope · type-gen = TS+JSON Schema+Zod · custom
responses = static (no rules engine) v1 · integrations = typed forwarding targets +
catalog, fire-and-forget v1 · AI = BYOK (Groq/OpenAI/Anthropic) with key guides,
keys encrypted for claimed users only · API client = minimal/no-history v1 · PWA =
app-shell only · CLI `listen` = future/out-of-scope · mobile = tiered (core
inspect loop first-class, authoring desktop-recommended; see `15`).

## How these relate to the other docs

- **`../00`–`../04`** — *what* the product is and the technical designs. These PRDs
  are the *experience* layer on top.
- **`../UI redesign/`** — the Emerald Console visual system. These PRDs specify
  behavior/flows; that folder owns pixels/tokens/components. They converge.
