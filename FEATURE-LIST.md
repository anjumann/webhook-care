# Webhook Catcher — Feature List (PM Reference)

> One-page, PM-facing snapshot. The "why/how" detail lives in
> `IMPROVEMENTS.md` (audit + roadmap), `FEATURES-DESIGN.md` (feature designs),
> and `IMPLEMENTATION-PLAN.md` (build checklist).
>
> **Scope:** all-free product. No paid tiers; the `/pricing` page has been
> removed. Every feature below ships to all users (retention = 30 days for everyone).
>
> Legend: 🟢 keep · 🟡 needs upgrade · 🔴 broken / high-priority upgrade

## List 1 — Existing Features (& upgrade status)

| Feature | Status | Note |
|---------|--------|------|
| Anonymous user (ULID + localStorage) | 🔴 | Unrecoverable, no auth — fixed by magic-link identity |
| Create / edit / delete endpoints | 🟡 | Add ownership checks; edit is non-atomic |
| Webhook capture (all HTTP methods) | 🟡 | Only saves JSON/form bodies; drops XML/text/binary |
| Request logging & inspection | 🟡 | Loads *all* requests, no pagination |
| Forwarding to downstream URLs | 🟢 | **Keep as-is** (free plan) — stays fire-and-forget; no durable-delivery upgrade for now |
| Request search & filter | 🟡 | Client-side only, won't scale |
| Clear / delete requests, export JSON | 🟢 | Minor polish |
| **Webhook Playground** (test a single endpoint) | 🟢 | **Keep as-is** — correctly scoped to that endpoint's locked URL |
| Profile (name + avatar) | 🟡 | Avatar path bug, no auth |
| Dashboard metrics | 🔴 | Success rate / avg time are fake placeholders |
| Contact form (Resend email) | 🟢 | — |
| Real-time updates | 🔴 | Promised in README; reality is manual Refresh |

## List 2 — New Features (adding)

| # | Feature | Effort | Note |
|---|---------|--------|------|
| 1 | **30-day auto-retention** | M | Upstash midnight job + pinning to keep important requests |
| 2 | **Email / magic-link identity** | M | Optional, recoverable, cross-device; gates export & tokens |
| 3 | **ZIP export** | M | Download all/selected endpoints + payloads in one archive |
| 4 | **Agent REST API** | M | Read-only, token-scoped programmatic access |
| 5 | **MCP server** | M | AI agents connect & fetch/search webhooks via tools |
| 6 | **Basic API Client** (standalone) | S | Simple API calls without leaving the platform; *not* Postman-level; separate from the endpoint playground |
| 7 | **PWA / Installable app** | S | "Install" to device — standalone window, app icon, offline shell |

**Supporting enablers (not user-facing):** authorization on all routes ·
rate limiting · pagination · secret redaction · service layer + tests.
*(Durable forwarding deferred — forwarding stays as-is on the free plan.)*

---

### Quick decisions still open
- **API Client** — persistence in v1? Recommend **minimal** (no save/history), add later if used.
- **PWA** — offline scope: **app shell only** (data is live/per-user).
- **Retention** — 30-day default, hard delete, pinned exempt (confirm).
- **Identity merge** — adopt & import a browser's endpoints into the claimed email (recommended).
