# 01 · Component Library

Every component the Emerald Console needs, mapped to a **real file** and its
**shadcn base** (where one exists). Reference CSS class names (from `theme.css` /
`emerald.css`) are given so you can match the spec exactly.

Convention: build app-specific console components under `src/components/console/`,
keep them thin wrappers over `src/components/ui/*` (shadcn) so behavior/a11y comes
for free and only the skin changes.

---

## A. Shell & navigation

### `Shell` — sidebar console frame
> Reference: `Screens.jsx` `Shell()` · CSS `.whc .side .nav .main .topbar .content`

The structural keystone. Replaces the centered `src/app/dashboard/layout.tsx`.

- **New file:** `src/components/console/shell.tsx` (client) — renders
  `<Sidebar/> + <Topbar/> + <main>{children}</main>`. Apply `data-mode` via
  next-themes; the `.whc` flex container fills `100%` height.
- **`src/app/dashboard/layout.tsx`** → render `<Shell>` instead of `<Header/>` +
  `max-w-7xl`. The marketing pages keep their own layout (see `../02 §7`).

**Sidebar** (`.side`, 236px):
- `Brand` — `RelayMark` in a gradient tile (`.mark`, `linear-gradient(140deg,
  accent, accent2)`) + wordmark + version chip. New: `src/components/console/brand.tsx`.
- `Nav` — capped groups ("Workspace", "Account"), `nav-item` with icon + label +
  optional count; `.active` = `accent-soft` bg + accent icon. Drive `active` from
  `usePathname()`. New: `src/components/console/sidebar-nav.tsx`. Nav items map to
  real routes — see `../02 §0`.
- `Account` footer (`.acct`) — avatar initial tile + name + email + chevron →
  dropdown (profile, theme, logout). Wire to `useUser()` / profile data; email
  appears once magic-link identity (`../03 §B.2`) lands.

**Topbar** (`.topbar`, 56px):
- `Breadcrumb` (`.crumb`) — reuse `src/components/custom-breadcrumb.tsx`, restyle
  with `dim` text + `text` bold leaf + chevron separators.
- Spacer, then `⌘K search` (`.tsearch`) → wire to the existing
  `components/ui/command.tsx` (cmdk) palette. **This finally uses cmdk** (called
  out as a dependency in `../02 §5.4`).
- `ThemeToggle` (`.ico-btn` with sun/moon) — reuse `src/components/theme-toggle.tsx`.
- `Bell` notifications `.ico-btn`.

**Content** (`.content`) — radial accent glow backdrop (`00 §2`); add `.flex`
modifier variant for the inspector's full-height master–detail.

---

## B. Data display

### KPI card — `<KpiCard>`
> Reference: `.kpi` (+ `.kpi.feature` for the first/highlighted), `Screens.jsx` KPIS

- **New:** `src/components/console/kpi-card.tsx`. Base on shadcn `card.tsx` or
  plain div. Parts: `.top` (icon tile + label) · `.num` (29px tabular) · `.delta`
  (`up`=ok / `flat`=dim, optional `arrowUp`) · `.spark` (absolute bottom-right).
- First card gets `.feature` (accent-tinted gradient bg + accent border).
- Icon tile color cycles `c1→c4` by index (`.kpi:nth-child(n) .ic`).
- Replaces the placeholder metric cards in `src/components/enhanced-card.tsx`
  usage on the dashboard. **Kills the "To be implemented" cards** (`../02 §1.2`).

### Sparkline — `<Sparkline>` & Area chart — `<AreaChart>`
> Reference: `Spark` in `Icons.jsx`; `AreaChart` referenced in `emerald-screens.jsx`

- `src/components/charts/sparkline.tsx` — port `Spark` (polyline over normalized
  pts). Tiny, dependency-free.
- `src/components/charts/area-chart.tsx` — the request-volume chart on endpoint
  detail. Either port the reference `AreaChart`/`DATA` from `design-canvas.jsx`,
  or back it with **recharts** (already vendored as `components/ui/chart.tsx` +
  `components/charts/line-chart.tsx`). Recharts is the lower-effort, real-data
  path; theme its stroke/fill to `var(--accent)`.

### Panel / card — `<Panel>`
> Reference: `.panel`, `.panel-head` (`.t` title · `.c` count chip · `.right`)

- `src/components/console/panel.tsx`. Header row + body. Used for "All endpoints",
  "Recent requests", "Request volume", playground compose, etc.

### Table — restyle shadcn `table.tsx`
> Reference: `.tbl` (uppercase `faint` headers, `13.5px` cells, row hover `elev2`)

- Add a console table style. Subcomponents seen in screens:
  - `.ep` endpoint cell (status dot + name + mono path) — for endpoint list.
  - `.t-meth` method cell (accent mono-bold).
  - `.num-cell` tabular numbers.
  - `.row-acts` trailing icon-button cluster (copy / open / more), hover-reveal.
- Use in `src/endpoints/endpoint-list.tsx` and the request tables.

### Badges, pills, chips
> Reference: `.badge` (`.ok`/`.off`), `.code-pill`/`StatusPill`, `.meth-pill`, `.chip`

- **`<StatusBadge>`** (active/paused) — base shadcn `badge.tsx`; dot + label;
  `ok` = `ok-soft`/`ok`, `off` = `elev2`/`dim`.
- **`<StatusPill code>`** — colored by `statusTone(code)` (`00 §8`); optional `lg`.
  New: `src/components/console/status-pill.tsx`. Used in every request table +
  inspector + playground response.
- **`<MethodPill>`** — mono accent (`.meth-pill`).
- **`<Chip>`** — meta chips on detail/inspector (`.chip` with icon + label +
  bold/mono value). New: `src/components/console/chip.tsx`.

### Service / endpoint logo — `<ServiceLogo>`
> Reference: `.svc-logo` / `.dt-logo`, `SVC` map in `emerald-screens.jsx`

- Small rounded tile with 2-letter initials on a `c1–c4` hue. Derive initials +
  hue deterministically from the endpoint name (hash → c-index). New:
  `src/components/console/service-logo.tsx`.

### Live tag — `<LiveTag>`
> Reference: `.live-tag` + `.pulse`, `LiveDot`

- Pill with pulsing dot ("live", "streaming", "live · 18/s"). New:
  `src/components/console/live-tag.tsx`. Ties to the SSE live stream (`../02 §5.1`).

### JSON viewer — `<JsonView>`
> Reference: `.json` + `hlJson()` highlighter; classes `j-key/j-str/j-num/j-bool/j-null`

- Replace the current `JsonDisplay` (`<pre>` + `JSON.stringify`) in
  `src/endpoints/request-list.tsx`. Either port `hlJson` (zero-dep) or adopt a
  collapsible tree (the roadmap wants "collapsible JSON tree", `../02 §5.1`).
  Tokens: keys `c2`, strings `ok`, numbers `c3`, bool `warn`, null `dim`.
- New: `src/components/console/json-view.tsx`.

### Key/value rows — `<KvList>`
> Reference: `.kv` / `.kv-row` (mono, 2-col)

- For headers/query/response-headers display in the inspector. New:
  `src/components/console/kv-list.tsx`.

### Forwarding result row — `<ForwardResult>`
> Reference: `.fwd-res` (status icon tile + url + meta + trailing pill)

- Shows a forwarding destination + delivery outcome. New:
  `src/components/console/forward-result.tsx`. Real delivery data arrives with the
  durable-forwarding/`ForwardDelivery` work (`../02 §4`); until then render
  config-only (no fake success rates — see `../02 §1.1 #8`).

---

## C. Inputs & forms

### Buttons — restyle shadcn `button.tsx`
> Reference: `.btn`, `.btn.primary` (accent gradient + glow), `.btn.ghost`, `.btn.sm`

Map variants: `primary` → gradient `accent→accent2` + shadow glow; `ghost` →
transparent + `border2`; `default`/secondary → `elev` bg. Add `sm` size (30px).

### Inputs / textarea / select — restyle `input.tsx`, `textarea.tsx`, `select.tsx`
> Reference: `.input/.textarea/.select` (inset bg, `border2`, 38px), `.input.mono`

### Input group (prefix) — `<InputGroup>`
> Reference: `.input-group` (`.pfx` prefix · input · `.ai` accent affix)

- The `relay.dev/in/` + name + sparkle-suggest pattern (create form, playground
  target). New: `src/components/console/input-group.tsx`. The sparkle affix wires
  to the existing random-name generator in `src/endpoints/endpoint-edit-form.tsx`.

### Method selector — `<MethodSelect>`
> Reference: `.method` (mono pill + chevron)

- Used in forwarding rows + playground. Base shadcn `select.tsx`, restyled.

### Key/value editor — `<KvEditor>`
> Reference: `.kv-edit` (key input · value input · delete)

- Dynamic header rows in the playground / API client. New:
  `src/components/console/kv-editor.tsx`. Replaces the ad-hoc header rows in
  `src/endpoints/webhook-test-section.tsx`.

### Add-row button — `<AddRow>`
> Reference: `.add-url` (dashed accent, "Add destination/header")

### Switch — restyle shadcn `switch.tsx`
> Reference: `.switch` / `.switch.on` (knob slides, accent bg). Use for the
> create-form Options (retain / verify signature / retry).

### Segmented control — `<Segments>`
> Reference: `.segs` (e.g. 1h/24h/7d, All/Active/Paused). Base shadcn
> `toggle-group.tsx` or `tabs.tsx`. New: `src/components/console/segments.tsx`.

### Tabs — restyle shadcn `tabs.tsx`
> Reference: `.tabs`/`.tab` with count chip `.n` (Body / Headers N / Query N) in
> the inspector. Active = `text` + accent underline.

### Code-editor textarea — `<CodeEditor>`
> Reference: `.code-editor` (mono, inset). Playground/API-client JSON body with a
> Beautify action (reuse the existing beautify logic in `webhook-test-section.tsx`).

---

## D. Aside / summary widgets (create form, playground, detail)

| Component | Reference | Use |
|---|---|---|
| `<SumCard>` | `.sum-card` + `.st` title | generic right-rail card |
| `<UrlBox>` | `.url-box` | the endpoint URL + copy (reuse `copy-button.tsx`) |
| `<CodeBlock>` | `.code` | the cURL sample (`.k/.s/.p` token colors) |
| `<MetaList>` | `.meta-list`/`.mi` | label↔value config rows (method, region, retention…) |
| `<Tip>` | `.tip` | accent-tinted hint box with info icon |
| `<TemplateRow>` | `.tmpl` | playground provider templates (logo + name + event) |
| `<RespStatus>` | `.resp-status` | playground "Last response" (big code + meta) |
| `<EnvPill>` | `.env` | "Production · region" pill with pulse on page headers |

Build these under `src/components/console/`; all are small and reused across 2–3
screens.

---

## E. Reuse / consolidation notes

- **Toasts:** the repo has *both* `react-hot-toast` and `sonner`
  (`components/ui/sonner.tsx`). Pick **one** during the redesign (recommend
  `sonner`, already shadcn-styled) — matches `../02 §5.5`.
- **Command palette:** `components/ui/command.tsx` exists but is unused; the new
  topbar `⌘K` is its first real home.
- **Existing app components to retire/replace:** `src/components/header.tsx`
  (top nav → sidebar), `src/components/enhanced-card.tsx` (→ `KpiCard`/`Panel`),
  the inline `JsonDisplay` in `request-list.tsx` (→ `JsonView`).
- **Keep:** `copy-button.tsx`, `custom-breadcrumb.tsx`, `theme-toggle.tsx`,
  `theme-provider.tsx`, all `framer-presets/*`, the `charts/line-chart.tsx`
  recharts base.
