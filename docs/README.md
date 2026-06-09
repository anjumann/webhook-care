# Webhook Catcher — Documentation

All product, architecture, and planning docs for Webhook Catcher, in reading
order. Start at the top for a guided path, or jump to whatever you need.

| # | Doc | What it is | Read it when… |
|---|-----|-----------|----------------|
| 00 | [Product Overview](./00-product-overview.md) | PM snapshot — feature list (existing + new) with status | You want the one-page "what are we building" view |
| 01 | [Architecture](./01-architecture.md) | How the app works **today** — webhooks, localStorage identity, payload storage, every page/route | You need to understand the current codebase |
| 02 | [Audit & Roadmap](./02-audit-and-roadmap.md) | Honest audit (bugs, security, UX) + prioritized roadmap, incl. the 30-day retention design | You want to know what to fix and in what order |
| 03 | [Feature Designs](./03-feature-designs.md) | Detailed designs: magic-link identity, ZIP export, agent API | You're about to build identity / export / agent access |
| 04 | [Implementation Plan](./04-implementation-plan.md) | MCP server design + full checkbox build plan for every workstream | You're ready to write code |

> The repo's root `README.md` is the original Product Requirements Document
> (partly aspirational). These `docs/` are the current, accurate source of truth.

---

## Scope & key decisions (current)

- **All-free product.** No paid tiers; the `/pricing` page was removed.
- **Retention:** webhooks auto-delete after **30 days** for everyone, via an
  Upstash QStash midnight schedule. On the QStash free tier (1,000 msg/day) this
  runs as a **single nightly batched job**, with a MongoDB TTL index as the
  safety net. (See `02` §6.)
- **Identity:** anonymous-first (ULID), with **optional email / magic-link**
  claim for recovery and cross-device access. (See `03` §1.)
- **Forwarding:** kept **as-is** (fire-and-forget) — durable-forwarding upgrade
  deferred while free.
- **Webhook Playground:** kept as-is (endpoint-scoped test tool).

## New features being added

1. 30-day auto-retention (Upstash) · 2. Email/magic-link identity ·
3. ZIP export · 4. Agent REST API · 5. MCP server ·
6. Basic standalone API client · 7. PWA / installable app

See `00-product-overview.md` for the full list with status, and
`04-implementation-plan.md` for the build checklist.

## Suggested build order

`foundations → identity/guards → retention → export → token API → MCP server →
API client → PWA`. Rationale in `04-implementation-plan.md` §B.8.
