# Webhook Catcher — UI Redesign ("Relay · Emerald Console")

This folder is the **design source of truth** for re-skinning and re-laying-out
the entire Webhook Catcher application to match the **Relay · Emerald Console**
reference in `../../webhook catcher/`.

> **🚧 Build status (2026-06-09):** Phase 0 (foundation), Phase 1 (shell) and
> Phase 3 §1 (Endpoints list) are **done**; Phase 2 core components are partly
> done. Detail / create-edit / playground / profile still render pre-redesign
> markup inside the new shell. See the live checklist in
> [`03-implementation-plan.md`](./03-implementation-plan.md) (incl. deviations:
> toast lib is `sileo`, brand mark is lucide `Webhook`).

> **Reference artifact:** open `webhook catcher/Relay - Emerald Console.html` in a
> browser. It renders six artboards — Endpoints list, Endpoint detail, Request
> inspector, Live requests, Playground, Create endpoint — in both Dark and Light
> using the Emerald theme. The CSS (`theme.css`, `layouts.css`, `emerald.css`)
> and JSX (`Screens.jsx`, `emerald-screens.jsx`, `Icons.jsx`) are the literal
> spec these docs translate into the real Next.js + Tailwind v4 + shadcn app.

## What this is (and isn't)

- **It is** a visual + structural redesign: a left **sidebar console** shell,
  a refined **emerald** token ramp (dark + light), restyled components (KPI
  cards, panels, tables, pills, chips, the master–detail inspector), and new
  typography.
- **It is not** a feature change. The functional roadmap — retention, identity,
  export, agent API, MCP, PWA — lives in `../00`–`../04` and is unchanged. This
  redesign is the **shell those features get poured into**. Where a planned
  feature needs UI (e.g. pin/retention chips, API-token settings), the component
  specs here cover it so the two efforts converge instead of colliding.

## Reading order

| # | Doc | What it covers |
|---|-----|----------------|
| 00 | [Design Language](./00-design-language.md) | Color tokens (dark+light), the exact `globals.css` migration, typography, spacing, radius, shadow, iconography, motion |
| 01 | [Component Library](./01-component-library.md) | Every UI primitive & app component, mapped to a real file + its shadcn base |
| 02 | [Screen Redesigns](./02-screen-redesigns.md) | Page-by-page redesign of every route, mapped to current files |
| 03 | [Implementation Plan](./03-implementation-plan.md) | Phased, checkbox build plan with file-by-file changes |

## The one big structural change

Today the dashboard is a **centered, top-header layout**
(`src/app/dashboard/layout.tsx` → `max-w-7xl mx-auto` + `<Header/>`). The target
is a **full-height sidebar console**:

```
┌──────────┬─────────────────────────────────────────────┐
│ sidebar  │ topbar (breadcrumb · ⌘K search · theme · 🔔) │
│ 236px    ├─────────────────────────────────────────────┤
│ brand    │                                             │
│ nav      │  content (radial emerald glow, 26/32 pad)   │
│ account  │                                             │
└──────────┴─────────────────────────────────────────────┘
```

Everything else (colors, components, screens) hangs off that shell. See `01 §Shell`.

## Good news: the palette is already half-done

`src/app/globals.css` already uses an **emerald-family** primary
(`--primary: oklch(0.72 0.19 149.58)` ≈ green). The redesign **refines and
extends** that ramp to match the reference's richer vocabulary (elevation
surfaces, `mid`/`dim`/`faint` text tiers, `c1–c4` accents, `ok/warn/danger`),
rather than swapping a foreign palette in. Low-risk, high-fidelity.
