# 00 · Design Language

The complete visual system for the Emerald Console, and exactly how to express it
in the app's **Tailwind v4 + shadcn** setup (`src/app/globals.css`). Everything
here is lifted from the reference `webhook catcher/theme.css` and `emerald.css`
and translated into tokens the existing components can consume.

---

## 1. Token model

The reference uses a **two-layer** token model. We adopt it verbatim:

1. **Identity tokens** (mode-agnostic): font family, mono family, radius.
2. **Color ramp** (per mode: dark + light), split into semantic tiers:

| Tier | Tokens | Role |
|------|--------|------|
| Surfaces | `bg` · `elev` · `elev2` · `inset` | page → card → hover/raised → sunken (inputs, code) |
| Lines | `border` · `border2` | hairline dividers · stronger input borders |
| Text | `text` · `mid` · `dim` · `faint` | primary → secondary → tertiary → labels/placeholder |
| Brand | `accent` · `accent2` · `accentfg` | primary hue · gradient partner · text-on-accent |
| Data viz | `c1` · `c2` · `c3` · `c4` | KPI icons, sparklines, service logos |
| Status | `ok` · `warn` · `danger` | success · warning · error |
| Derived | `accent-soft` · `accent-line` · `ok-soft` · `danger-soft` | `color-mix` tints, computed once |

The derived tints are computed with `color-mix` so each theme only declares solid
hues:

```css
--accent-soft : color-mix(in srgb, var(--accent) 16%, transparent);
--accent-line : color-mix(in srgb, var(--accent) 40%, transparent);
--ok-soft     : color-mix(in srgb, var(--ok)     16%, transparent);
--danger-soft : color-mix(in srgb, var(--danger) 15%, transparent);
```

---

## 2. The Emerald ramp (canonical values)

Copy these directly. (Reference: `theme.css` lines 31–44.)

### Dark
```
bg #08110d   elev #101b16   elev2 #17251e   inset #0b1510
border rgba(120,200,170,.12)   border2 rgba(120,200,170,.2)
text #eaf3ee   mid #9fb6ab   dim #647a70   faint #43554d
accent #15bd86   accent2 #4fe0a0   accentfg #04140d
c1 #19c08a   c2 #2dd4bf   c3 #84cc16   c4 #34d399
ok #3ddc88   warn #e7c35a   danger #f06a6a
```

### Light
```
bg #eef6f1   elev #ffffff   elev2 #f4faf6   inset #e8f3ed
border rgba(20,90,60,.10)   border2 rgba(20,90,60,.16)
text #0c2118   mid #4d685c   dim #7c958a   faint #aac2b6
accent #0d9c6e   accent2 #2bb87f   accentfg #ffffff
c1 #0d9c6e   c2 #0e9e8f   c3 #558c0a   c4 #10a86f
ok #0d9c6e   warn #c98a1e   danger #e05656
```

### Surface treatment (per mode)
```css
dark : --card-shadow: inset 0 1px 0 rgba(255,255,255,.03);
light: --card-shadow: 0 1px 2px rgba(20,22,40,.05), 0 6px 18px rgba(20,22,40,.06);
```

### Content backdrop glow
The content area carries a subtle top-left accent wash (reference `theme.css` `.content`):
```css
background: radial-gradient(115% 60% at 0% -8%,
  color-mix(in srgb, var(--accent) 7%, transparent), transparent 55%);
```

---

## 3. `globals.css` migration

We keep shadcn's token names (so all 60+ `components/ui/*` keep working) **and**
add the console vocabulary. Strategy: **map shadcn tokens onto the emerald ramp**,
then **add the extra tokens** the console needs, then **expose them via
`@theme inline`** as Tailwind utilities (`bg-elev2`, `text-mid`, `text-dim`, …).

> Note on color space: shadcn here uses `oklch`. You can keep hex/`rgba` for the
> new tokens — Tailwind v4 + `color-mix` handle mixed spaces fine. Keep the
> existing `oklch` values where they already match emerald; only retune the ones
> that don't.

### 3a. Map shadcn → emerald

| shadcn token | ← emerald | Notes |
|---|---|---|
| `--background` | `bg` | page |
| `--foreground` | `text` | |
| `--card` / `--popover` | `elev` | cards, menus |
| `--card-foreground` / `--popover-foreground` | `text` | |
| `--primary` | `accent` | buttons, active nav |
| `--primary-foreground` | `accentfg` | |
| `--secondary` | `elev2` | |
| `--secondary-foreground` | `mid` | |
| `--muted` | `inset` | inputs, code |
| `--muted-foreground` | `dim` | |
| `--accent` (shadcn hover bg) | `accent-soft` | hover/selected tint |
| `--accent-foreground` | `text` | |
| `--destructive` | `danger` | |
| `--border` | `border` | |
| `--input` | `border2` | |
| `--ring` | `accent` | focus ring |
| `--chart-1..4` | `c1..c4` | reuse for sparklines |
| `--sidebar*` | map to `bg` / `text` / `accent` … | the real sidebar uses `bg` + `border` |

### 3b. Add console tokens (new)

Add these to **both** `:root` (light) and `.dark`, plus the derived tints on a
shared selector:

```css
/* new console tokens — VALUES per mode from §2 */
--elev2:  …;   --inset: …;
--mid:    …;   --dim: …;   --faint: …;
--border2:…;
--accent2:…;   --accentfg: …;
--c1:…; --c2:…; --c3:…; --c4:…;
--ok:…;  --warn:…;  --danger-solid:…;   /* keep shadcn --destructive too */
--card-shadow: …;                       /* per-mode, §2 */

/* derived (declare once, e.g. on body/:root after the ramp) */
--accent-soft: color-mix(in srgb, var(--accent) 16%, transparent);
--accent-line: color-mix(in srgb, var(--accent) 40%, transparent);
--ok-soft:     color-mix(in srgb, var(--ok) 16%, transparent);
--danger-soft: color-mix(in srgb, var(--danger) 15%, transparent);
```

### 3c. Expose as utilities (`@theme inline`)

```css
@theme inline {
  /* …existing shadcn mappings… */
  --color-elev:   var(--card);
  --color-elev2:  var(--elev2);
  --color-inset:  var(--inset);
  --color-mid:    var(--mid);
  --color-dim:    var(--dim);
  --color-faint:  var(--faint);
  --color-accent2:var(--accent2);
  --color-ok:     var(--ok);
  --color-warn:   var(--warn);
  --color-c1: var(--c1); --color-c2: var(--c2);
  --color-c3: var(--c3); --color-c4: var(--c4);
}
```

Now you can write `className="bg-elev2 text-mid border-border2"` anywhere.

### 3d. Radius

Reference Emerald uses `--radius:13px; --radius-sm:9px`. The app currently uses
`--radius: 0.5rem` (8px). **Bump to match:**
```css
--radius: 0.8125rem;   /* 13px → radius-lg */
/* shadcn derives: radius-sm = radius-4px (9px), radius-md = radius-2px (11px) */
```
Verify the existing `@theme inline` radius derivations (`--radius-sm:
calc(var(--radius) - 4px)` …) land on 9/11/13 — they do with 13px base.

### 3e. Scrollbars
The reference shows scrollbars in scroll regions; the app currently **hides all
scrollbars globally** (`globals.css` `scrollbar-width: none !important`). Keep
hidden globally is fine, but the inspector/json panes read better with a thin
styled scrollbar — consider scoping a `.scroll-thin` utility for those.

---

## 4. Typography

| Role | Reference (Emerald) | Current app | Action |
|------|--------------------|-------------|--------|
| Sans | **Hanken Grotesk** (400–700) | DM Sans | Swap to Hanken Grotesk via `next/font/google` in `src/app/layout.tsx` |
| Mono | **JetBrains Mono** (400/500) | IBM Plex Mono | Swap to JetBrains Mono |

Set both as CSS vars so `--font-sans` / `--font-mono` (already wired in
`globals.css` + `@theme`) just point at the new families.

### Type scale (from the reference)
| Use | Size / weight |
|-----|---------------|
| Page H1 | 25px / 700 / `-0.5px` tracking |
| Detail H1 | 24px / 700 |
| KPI number | 29px / 700 / `-0.6px` / tabular-nums |
| Section title (panel `.t`) | 14px / 600 |
| Body | 13.5px / 400 |
| Table cell | 13.5px |
| Caption / labels (uppercase) | 11px / 600 / `.05em` / uppercase / `faint` |
| Mono code | 11.5–12.5px |
| Nav item | 13.5px / 500 |

Numbers in KPIs and tables use `font-variant-numeric: tabular-nums`.

---

## 5. Spacing, layout metrics

| Element | Value |
|---------|-------|
| Sidebar width | `236px` (flex `0 0 236px`) |
| Sidebar padding | `18px 14px` |
| Topbar height | `56px` |
| Content padding | `26px 32px 32px` |
| KPI grid | `repeat(4, 1fr)`, gap `16px` |
| Two-col detail (`.dgrid`) | `1fr 320px`, gap `18px` |
| Form / playground grid | `1fr ~372–380px`, gap `24px` |
| Inspector grid | `316px 1fr` (list / detail); detail body `1fr 320px` |
| Card padding | `15–22px` |
| Button height | `34px` (sm `30px`) |
| Input height | `38px` |
| Chip / badge height | `30px` / pill `20px` radius |

---

## 6. Iconography

The reference ships a feather-style stroke set in `Icons.jsx`
(`stroke-width 1.7`, 24×24, round caps). The app already depends on
**`lucide-react`** (feather-based) — use it directly; the glyph names map almost
1:1:

| Reference `Ico.*` | lucide-react |
|---|---|
| activity | `Activity` |
| inbox | `Inbox` |
| send | `Send` |
| beaker | `FlaskConical` |
| history | `History` |
| settings | `Settings` |
| search | `Search` |
| bell | `Bell` |
| copy | `Copy` |
| trash | `Trash2` |
| shield | `Shield` / `ShieldCheck` |
| clock | `Clock` |
| zap | `Zap` |
| sparkle | `Sparkles` |
| download | `Download` |
| refresh | `RefreshCw` |
| globe | `Globe` |
| chevR/chevD | `ChevronRight` / `ChevronDown` |
| sun/moon | `Sun` / `Moon` |

Keep stroke width ~1.7 (`<Icon strokeWidth={1.7}/>`) for fidelity.

**Brand mark** — recreate the `Mark` "relay/forward" hub glyph (`Icons.jsx`
lines 41–49) as `src/components/icons/relay-mark.tsx`. **Sparkline** (`Spark`,
lines 52–61) becomes `src/components/charts/sparkline.tsx`.

---

## 7. Motion

| Effect | Spec |
|--------|------|
| Live pulse dot | `7px` dot, `box-shadow: 0 0 0 3px ok-soft`, `livep` keyframe (opacity 1→.35→1, 1.6s) |
| Nav / button hover | `all .15s` |
| Switch knob | `transform/left .2s` |
| Theme toggle, expand/collapse | reuse existing Framer Motion presets in `src/framer-presets/` |
| New-request arrival (live stream) | subtle highlight-then-fade on row insert (ties to SSE work in `../02 §5.1`) |

Keep Framer Motion (already a dependency) for the inspector/playground
open–close and the live-row animation; CSS keyframes for the pulse.

---

## 8. Status & method color logic

Centralize the status-code → color mapping (reference `codeTone` + `StatusPill`):

```
< 300  → ok       (e.g. 200, 202)
< 400  → dim/mid  (e.g. 304)
< 500  → warn     (e.g. 401, 403, 404)
>= 500 → danger   (e.g. 500)
```

HTTP **method** color: methods render in `accent` mono-bold in tables/pills
(`.t-meth`, `.meth-pill`). Keep the existing `METHODS` map in
`src/constant/app-constant.ts` but recolor it to the emerald ramp. Put the
status logic in a shared `statusTone(code)` helper (e.g. `src/lib/status.ts`)
used by every pill.
