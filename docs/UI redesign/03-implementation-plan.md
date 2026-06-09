# 03 · Implementation Plan

Phased, checkbox build plan for the Emerald Console redesign. Each item is a
concrete unit of work referencing the specs in `00`–`02`. The redesign is mostly
**presentational** — it rides on top of existing data/logic — so it can land in
parallel with the feature roadmap (`../00`–`../04`), as long as the token + shell
foundation goes first.

> Guiding rule: **re-skin, don't re-logic.** Keep SWR hooks, react-hook-form +
> Zod, server actions, and API routes intact. Swap markup and styles only —
> unless an item explicitly ties to a roadmap feature.

---

## Phase 0 — Foundation (do first; everything depends on it)

**Tokens & theme** (`00`)
- [ ] Bump `--radius` to `13px` in `src/app/globals.css`; verify sm/md derive to 9/11px.
- [ ] Retune shadcn tokens to the emerald ramp (light `:root` + `.dark`) — `00 §3a`.
- [ ] Add console tokens (`--elev2 --inset --mid --dim --faint --border2
  --accent2 --accentfg --c1..c4 --ok --warn --card-shadow`) for both modes — `00 §3b`.
- [ ] Add derived tints (`--accent-soft --accent-line --ok-soft --danger-soft`) — `00 §3b`.
- [ ] Expose new tokens via `@theme inline` (`bg-elev2`, `text-mid`, …) — `00 §3c`.
- [ ] Add the `.content` radial-glow + per-mode `--card-shadow`.

**Typography & icons** (`00 §4`, `§6`)
- [ ] Swap fonts to **Hanken Grotesk** + **JetBrains Mono** via `next/font` in
  `src/app/layout.tsx`; point `--font-sans`/`--font-mono` at them.
- [ ] Confirm `lucide-react` icon mapping; create `src/components/icons/relay-mark.tsx`.
- [ ] Port `Sparkline` → `src/components/charts/sparkline.tsx`.

**Shared helpers**
- [ ] `src/lib/status.ts` — `statusTone(code)` (`00 §8`).
- [ ] Recolor `METHODS` in `src/constant/app-constant.ts` to the emerald ramp.
- [ ] Pick one toast lib (recommend `sonner`); remove the other (`01 §E`).

## Phase 1 — Shell (the structural change)

- [ ] `src/components/console/shell.tsx` — sidebar + topbar + content (`01 §A`).
- [ ] `brand.tsx`, `sidebar-nav.tsx` (active from `usePathname`), account footer.
- [ ] Topbar: restyle `custom-breadcrumb.tsx`; mount `⌘K` palette on
  `components/ui/command.tsx`; reuse `theme-toggle.tsx`; bell.
- [ ] Rewrite `src/app/dashboard/layout.tsx` to render `<Shell>` (retire
  `header.tsx` from the dashboard).
- [ ] Verify full-height flex + the `.content.flex` variant (for the inspector).

## Phase 2 — Core console components (`01`)

Build under `src/components/console/`, thin over shadcn:
- [ ] `panel.tsx`, `kpi-card.tsx`, `segments.tsx`
- [ ] `status-pill.tsx`, `status-badge`, `method-pill`, `chip.tsx`, `live-tag.tsx`
- [ ] `service-logo.tsx` (deterministic initials + `c1–c4` hue)
- [ ] Restyle shadcn `button.tsx` (primary gradient/ghost/sm), `input.tsx`,
  `textarea.tsx`, `select.tsx`, `switch.tsx`, `table.tsx`, `tabs.tsx`, `badge.tsx`
- [ ] `input-group.tsx`, `kv-editor.tsx`, `kv-list.tsx`, `method-select`, `add-row`
- [ ] `json-view.tsx` (port `hlJson` or collapsible tree)
- [ ] Aside set: `sum-card`, `url-box`, `code-block`, `meta-list`, `tip`,
  `template-row`, `resp-status`, `env-pill`, `forward-result`
- [ ] `area-chart.tsx` (recharts-backed, themed) for request volume

## Phase 3 — Screen migrations (`02`)

Re-skin in roughly user-value order; each reuses existing data/logic:
- [ ] **Endpoints list** — `dashboard/[userId]/page.tsx` + `endpoint-list.tsx`
  (KPI row, console table). Remove fake metric cards (`02 §1`).
- [ ] **Create / Edit** — `endpoint-edit-form.tsx` two-col form + aside (`02 §6`).
- [ ] **Endpoint detail** — `[id]/page.tsx` (head, KPIs, volume, recent, forwarding,
  config); migrate Integration/History; **add request pagination** (`02 §2`).
- [ ] **Playground** — re-skin `webhook-test-section.tsx` to the two-col compose +
  aside; extract a shared compose component (`02 §5`).
- [ ] **Profile** — re-skin + fix avatar double-prefix bug (`02 §7`).
- [ ] **Empty / loading / error states** — onboarding card, skeletons (`02 §8`).

## Phase 4 — Live & inspector (depend on SSE/feature work)

These need backend support from the roadmap; do after Phase 3:
- [ ] **Request inspector** master–detail screen (`02 §3`) — replaces row-expand.
- [ ] **Live requests** stream screen + SSE endpoint (`02 §4`, `../02-audit §5.1`).
- [ ] **Forwarding** nav/section once `ForwardDelivery` exists (`../02-audit §4`).

## Phase 5 — Cross-cutting polish

- [ ] **Marketing re-skin** — `components/home/*`, `header.tsx`, `footer.tsx` adopt
  emerald tokens + fonts (layout unchanged) (`02 §7`).
- [ ] **Accessibility** — status by icon+text not color alone; focus management on
  expand/dialogs; ARIA live region for new requests (`../02-audit §5.4`).
- [ ] **Mobile** — sidebar → drawer (`components/ui/sheet.tsx`); tables → cards.
- [ ] **Settings hub** scaffolding for API tokens / MCP / identity panels
  (`02 §7`, `../04-implementation-plan §B.4/§B.5`).

---

## Interlock with the feature roadmap

The redesign provides the **surfaces** these planned features need. Build the
component now (inert/config-only), wire data when the feature lands:

| Redesign surface | Feature it serves | Spec |
|---|---|---|
| KPI cards (success rate, p95, forwarded) | Real metrics counters | `../02-audit §4` |
| `ForwardResult` rows | Durable forwarding + `ForwardDelivery` | `../02-audit §4` |
| Live stream + `LiveTag` | SSE real-time | `../02-audit §5.1` |
| "expires in N days" chip + pin action | 30-day retention | `../04-implementation-plan §B.1` |
| Account footer email · `/auth/verify` card | Magic-link identity | `../04 §B.2` |
| Export dialog (Endpoints/detail) | ZIP export | `../04 §B.3` |
| Settings → API tokens / Connect agent | REST API + MCP | `../04 §B.4/§B.5` |
| Standalone playground (free URL) | Basic API client | `../04 §B.6` |
| Install affordance | PWA | `../04 §B.7` |

> **Don't ship fake-functional UI.** Where a control's backend doesn't exist yet
> (retry toggle, success-rate card, forwarding outcomes), either hide it or mark
> it clearly inert — the current app's "To be implemented" placeholders are an
> explicit anti-pattern we're removing (`../02-audit §1.3`).

## Definition of done (redesign)

- Every dashboard route renders inside the emerald sidebar console, dark + light.
- No fake metrics or dead placeholder UI remain.
- All existing behavior (create/edit/delete, copy URL, search, export, clear,
  test-send, profile) works unchanged through the new skin.
- shadcn primitives consume emerald tokens; one toast system; fonts swapped.
- Components map cleanly to the reference artboards in
  `webhook catcher/Relay - Emerald Console.html` (visual parity check, both modes).
