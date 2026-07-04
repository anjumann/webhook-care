# Archive — historical planning docs

These are **finished** or **superseded** documents, kept for rationale and history.
They are **not** the current source of truth. For what's true now, see:

- [`../ARCHITECTURE.md`](../ARCHITECTURE.md) — how the app works today.
- [`../BACKLOG.md`](../BACKLOG.md) — what's left to build.

## What's here

| Doc | Was | Status |
|---|---|---|
| [`PROGRESS.md`](./PROGRESS.md) | The consolidated build log across all workstreams | The full "what shipped, when, and why" record — still the best history |
| [`00-product-overview.md`](./00-product-overview.md) | PM one-pager | Historical |
| [`01-architecture.md`](./01-architecture.md) | Original architecture (2026-06-09, pre-B.0) | Superseded by `../ARCHITECTURE.md` |
| [`02-audit-and-roadmap.md`](./02-audit-and-roadmap.md) | Bug/security/UX audit + roadmap | Executed (B.0 fixes shipped) |
| [`03-feature-designs.md`](./03-feature-designs.md) | Designs: identity, export, agent API | Built |
| [`04-implementation-plan.md`](./04-implementation-plan.md) | Backend build checklist B.0–B.8 | Done |
| [`PRD/`](./PRD/) | DX PRDs for **shipped** surfaces (shell, dashboard, create/edit, export, identity, tokens, MCP, API client, PWA) | Built |
| [`UI-redesign/`](./UI-redesign/) | Emerald Console visual system + build plan | Mostly done; remaining screens/a11y tracked in `../BACKLOG.md` Tier 3 |

## Where the still-relevant specs went

PRDs for surfaces that are **not yet built** were moved to [`../specs/`](../specs/),
not here: endpoint detail/inspector (05), onboarding (02), custom responses (06),
responsive/mobile (15), and the two parked ones (forwarding integrations 07, AI
analysis 12). Build from those, track them in the backlog.
