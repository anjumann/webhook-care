# Webhook Catcher — Documentation

**Webhook Catcher** — catch, inspect, and forward webhooks. Next.js 15 + React 19,
MongoDB via Prisma, Tailwind v4 + shadcn/ui. Anonymous-first identity, all-free,
30-day retention. This `docs/` folder is the current source of truth (the root
`README.md` is the original aspirational PRD).

## Start here

| Doc | What it is |
|---|---|
| [**ARCHITECTURE.md**](./ARCHITECTURE.md) | How the app works **today** — layering, data model, the ingest hot path, auth guards, all surfaces (REST/MCP/relay/API-client/PWA), retention. |
| [**BACKLOG.md**](./BACKLOG.md) | The one list of what's **left to build**, ranked by ROI. Now/Next · Someday · Parked · deploy ops. |
| [**specs/**](./specs/) | Full PRD specs for the surfaces that are **not yet built** — build from these. |
| [**archive/**](./archive/) | Finished / superseded planning docs — original architecture, audit, feature designs, shipped PRDs, the UI-redesign system, and `PROGRESS.md` (the full build log). Historical, not current. |

## The 30-second status

- **Backend (B.0–B.8): done** — service layer, auth, retention, ZIP export, Agent
  REST, MCP server, relay + `wcat` CLI, API client, PWA. See `archive/PROGRESS.md`.
- **Differentiator (agent-native access): shipped.**
- **Product analytics (PostHog): instrumented.** SDK + proxy + identity (P0a) and
  the full event taxonomy incl. server events + privacy-policy line (P0b + P0c
  privacy) are done. Only remaining Tier-0 work is building the funnel/adoption/
  retention **insights in the PostHog UI**. Spec: [`specs/16`](./specs/16-analytics-posthog.md).
- **Core loop shipped:** the north-star **"watch it land live"** now works — an
  owner-guarded SSE stream (`/api/endpoints/[id]/stream`) prepends captures into
  the inspector in real time (Live toggle, on by default).
- **Activation:** **1-click first-run onboarding** ships — a brand-new browser is
  auto-given a starter endpoint and dropped on its detail page (no form).
- **Inspector power tools:** **copy-as-cURL**, **one-click provider samples /
  send-test**, and detail **pagination + server-side search** are shipped (all
  instrumented).
- **Remaining product gap:** **replay** (re-POST a stored request) and the first-
  request **"aha" celebration** (now unblocked by the live stream). See
  [`BACKLOG.md`](./BACKLOG.md).
- **Parked:** AI payload analysis, typed Slack/Discord integrations (see backlog
  for why).

## Day-to-day engineering contract

See [`../CLAUDE.md`](../CLAUDE.md) — commands, testing policy, definition of done,
performance/security acceptance criteria, and the gotchas (partial email index,
Mongo TTL, SSRF proxy, MCP, rate-limiting fail-open).
