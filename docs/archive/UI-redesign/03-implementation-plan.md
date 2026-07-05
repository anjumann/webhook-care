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

## 📊 Status — last updated 2026-06-09

**Done:** Phase 0 (foundation) · Phase 1 (shell) · Phase 2 core display components ·
Phase 3 §1 (Endpoints list). The dashboard route is fully on the Emerald Console.

**Deviations from the original spec:**
- **Toast lib = `sileo`** (https://sileo.aaryan.design), not `sonner`. Both
  `react-hot-toast` and `sonner` removed. Used via the `@/lib/toast` adapter
  (accepts a string or `SileoOptions`); host = `components/console/toaster.tsx`.
- **Brand mark = lucide `Webhook`** (clearer than the ported relay-hub glyph).
  `components/icons/relay-mark.tsx` still exists but is currently unused.
- **Topbar breadcrumb** is a new `console/console-breadcrumb.tsx` (pathname-driven);
  `custom-breadcrumb.tsx` was reduced to render only the page H1+description so
  there's no duplicate trail.

**Done outside the original checklist (polish/bug fixes):**
- Marketing `footer.tsx` re-skinned to emerald tokens.
- `themeColor` moved from `metadata` → `viewport` export (Next 15) with light/dark
  emerald colors.
- Removed the old dashboard screenshot from marketing `CatalogSection.tsx`.
- Fixed profile page null-input crashes (`userName`/`userImage` null guards).
- Sileo toast theme synced to next-themes (keyed remount).

**Not started:** Phase 3 §2–§6 (detail, create/edit, playground, profile, states —
all still render pre-redesign markup inside the new shell), Phase 4, Phase 5.

---

## Phase 0 — Foundation (do first; everything depends on it) — ✅ DONE

**Tokens & theme** (`00`)
- [x] Bump `--radius` to `13px` in `src/app/globals.css`; verify sm/md derive to 9/11px.
- [x] Retune shadcn tokens to the emerald ramp (light `:root` + `.dark`) — `00 §3a`.
- [x] Add console tokens (`--elev2 --inset --mid --dim --faint --border2
  --accent2 --accentfg --c1..c4 --ok --warn --card-shadow`) for both modes — `00 §3b`.
- [x] Add derived tints (`--accent-soft --accent-line --ok-soft --danger-soft`) — `00 §3b`.
- [x] Expose new tokens via `@theme inline` (`bg-elev2`, `text-mid`, …) — `00 §3c`.
- [x] Add the `.content` radial-glow (`.console-content`) + per-mode `--card-shadow`.

**Typography & icons** (`00 §4`, `§6`)
- [x] Swap fonts to **Hanken Grotesk** + **JetBrains Mono** via `next/font` in
  `src/app/layout.tsx`; point `--font-sans`/`--font-mono` at them.
- [x] Confirm `lucide-react` icon mapping; create `src/components/icons/relay-mark.tsx`.
  *(Created; brand ultimately uses lucide `Webhook` instead — relay-mark unused.)*
- [x] Port `Sparkline` → `src/components/charts/sparkline.tsx`.

**Shared helpers**
- [x] `src/lib/status.ts` — `statusTone(code)` (`00 §8`).
- [x] Recolor `METHODS` in `src/constant/app-constant.ts` to the emerald ramp.
- [x] Pick one toast lib — **chose `sileo`** (not sonner); removed react-hot-toast + sonner (`01 §E`).

## Phase 1 — Shell (the structural change) — ✅ DONE

- [x] `src/components/console/shell.tsx` — sidebar + topbar + content (`01 §A`).
- [x] `brand.tsx`, `sidebar-nav.tsx` (active from `usePathname`), account footer
  (`account-footer.tsx`). *(Account group moved to the bottom, above the user card.)*
- [x] Topbar: `console-breadcrumb.tsx`; mount `⌘K` palette on
  `components/ui/command.tsx` (`command-palette.tsx`); reuse `theme-toggle.tsx`; bell.
- [x] Rewrite `src/app/dashboard/layout.tsx` to render `<Shell>` (retired
  `header.tsx` from the dashboard; it remains for marketing).
- [x] Full-height flex shell; `.content.flex` variant exposed via `contentClassName`
  (not yet exercised — inspector screen is Phase 4).

## Phase 2 — Core console components (`01`) — 🟡 PARTIAL

Build under `src/components/console/`, thin over shadcn:
- [x] `panel.tsx`, `kpi-card.tsx`, `segments.tsx`
- [x] `status-pill.tsx`, `status-badge.tsx`, `method-pill.tsx`, `chip.tsx`
- [ ] `live-tag.tsx` (ties to SSE live stream — Phase 4)
- [x] `service-logo.tsx` (deterministic initials + `c1–c4` hue via `tones.ts`)
- [ ] Restyle shadcn `button.tsx` (primary gradient/ghost/sm), `input.tsx`,
  `textarea.tsx`, `select.tsx`, `switch.tsx`, `table.tsx`, `tabs.tsx`, `badge.tsx`
  *(Endpoints list uses an inline console table + gradient CTA for now; the shared
  shadcn primitives are not yet restyled.)*
- [ ] `input-group.tsx`, `kv-editor.tsx`, `kv-list.tsx`, `method-select`, `add-row`
- [ ] `json-view.tsx` (port `hlJson` or collapsible tree)
- [ ] Aside set: `sum-card`, `url-box`, `code-block`, `meta-list`, `tip`,
  `template-row`, `resp-status`, `env-pill`, `forward-result`
  *(`env-pill.tsx` done; the rest pending.)*
- [ ] `area-chart.tsx` (recharts-backed, themed) for request volume

## Phase 3 — Screen migrations (`02`) — 🟡 IN PROGRESS

Re-skin in roughly user-value order; each reuses existing data/logic:
- [x] **Endpoints list** — `dashboard/[userId]/page.tsx` + `endpoint-list.tsx`
  (real-data KPI row, console table, segments filter, skeleton + empty states).
  Fake metric cards removed (`02 §1`).
- [ ] **Create / Edit** — `endpoint-edit-form.tsx` two-col form + aside (`02 §6`).
- [ ] **Endpoint detail** — `[id]/page.tsx` (head, KPIs, volume, recent, forwarding,
  config); migrate Integration/History; **add request pagination** (`02 §2`).
  *(Still old shadcn-card layout; metrics are real, not fake.)*
- [ ] **Playground** — re-skin `webhook-test-section.tsx` to the two-col compose +
  aside; extract a shared compose component (`02 §5`).
- [ ] **Profile** — re-skin + fix avatar double-prefix bug (`02 §7`).
  *(Null-input crash fixed; visual re-skin + avatar preselect still pending.)*
- [ ] **Empty / loading / error states** — onboarding card, skeletons (`02 §8`).
  *(Endpoints list has a skeleton + empty/no-match states; other screens pending.)*

## Phase 4 — Live & inspector (depend on SSE/feature work) — ⬜ NOT STARTED

These need backend support from the roadmap; do after Phase 3:
- [ ] **Request inspector** master–detail screen (`02 §3`) — replaces row-expand.
- [ ] **Live requests** stream screen + SSE endpoint (`02 §4`, `../02-audit §5.1`).
- [ ] **Forwarding** nav/section once `ForwardDelivery` exists (`../02-audit §4`).

## Phase 5 — Cross-cutting polish — ⬜ MOSTLY NOT STARTED

- [ ] **Marketing re-skin** — `components/home/*`, `header.tsx`, `footer.tsx` adopt
  emerald tokens + fonts (layout unchanged) (`02 §7`).
  *(`footer.tsx` done; `header.tsx` + home sections still pending.)*
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

- [ ] Every dashboard route renders inside the emerald sidebar console, dark + light.
  *(Endpoints list ✅; detail/create/edit/playground/profile still pre-redesign.)*
- [x] No fake metrics or dead placeholder UI remain. *(All "To be implemented" cards removed.)*
- [x] All existing behavior (create/edit/delete, copy URL, search, export, clear,
  test-send, profile) works unchanged through the new skin.
- [x] One toast system (`sileo`); fonts swapped.
- [ ] shadcn primitives consume emerald tokens directly (tokens mapped ✅; primitive
  restyle for gradient buttons/inputs/etc. pending).
- [ ] Components map cleanly to the reference artboards in
  `webhook catcher/Relay - Emerald Console.html` (visual parity check, both modes).
