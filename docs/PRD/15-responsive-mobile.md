# 15 · Responsive & Mobile (Cross-Cutting)

> **Primary persona:** All · **Secondary:** Solo debugger
> **Phase:** threads through every phase (P1 surfaces get P1 mobile treatment) ·
> **Cites:** `00-prd-overview.md` (principle 11), `01-sidebar-shell.md`,
> `03-dashboard.md`, `05-endpoint-detail-inspector.md`, `14-pwa.md`

---

## 1. Problem & why now

Webhook tooling is **hard to fully optimize for mobile** — dense tables,
master-detail inspectors, JSON trees, code editors, and copy-paste setup flows are
fundamentally desktop-shaped. Pretending otherwise leads to a frustrating phone
experience. So instead of "make everything work on a phone," this PRD sets an
**honest, tiered bar**: nail the handful of things developers genuinely do on a
phone (check if a webhook arrived, read a payload, copy a URL, fire a test), and be
explicit that heavy authoring is **desktop-recommended**. This is a cross-cutting
spec every other PRD inherits — it doesn't replace their per-surface mobile notes,
it sets the rules they follow.

## 2. Target persona & jobs

- **Solo debugger (on the go):** "I got pinged that a webhook fired — let me check
  on my phone that it landed and glance at the payload."
- **All:** "The app shouldn't feel broken on a phone, even if I do the heavy work on
  a laptop."

## 3. The tiered bar (what "focus on what we can" means)

We classify every surface into one of three tiers. PRDs declare their tier.

| Tier | Meaning | Surfaces |
|------|---------|----------|
| **A — First-class mobile** | Fully usable, thumb-friendly, primary path on a phone. | Dashboard (`03`), Endpoint detail + **live stream** + payload viewer + copy + Send test + pin/replay (`05`), Sidebar/nav drawer + ⌘K-equivalent (`01`), Identity/claim flow incl. **magic-link verify** (`09`), PWA install (`14`). |
| **B — Usable, not optimized** | Works on mobile but desktop is nicer; acceptable friction. | Create/Edit endpoint (`04`), Custom responses (`06`), Forwarding/Integrations + setup guides (`07`), Export dialog (`08`), Settings + AI keys (`10`, `12`), API client (`13`). |
| **C — Desktop-recommended** | Functional but we explicitly steer to desktop; show a gentle hint. | Heavy code surfaces: **type generation** (`05`), **MCP/agent setup** copy-paste (`11`), multi-row header/JSON authoring in the API client (`13`). |

> **Rule:** the **core inspect loop (Tier A) must be excellent on mobile.** Everything
> a developer reaches for when they get a "did it fire?" notification works on a
> phone. Authoring-heavy work (Tier B/C) is allowed to be merely usable.

## 4. Responsive system (the shared rules)

### 4.1 Breakpoints

- **Mobile** `< 640px` · **Tablet** `640–1024px` · **Desktop** `> 1024px`.
- Sidebar console collapses to a **drawer** below ~1024px (per `01`); content goes
  full-width.

### 4.2 Layout transforms (applied everywhere)

- **Tables → cards.** Every data table (endpoints, requests, tokens) collapses to a
  stacked card list on mobile, surfacing the 3–4 fields that matter (e.g. request:
  method + status + time + size). (`03`, `05`, `10`.)
- **Master–detail → stack/push.** The inspector (`05`) and any two-column layout
  (create `04`, playground/API client `13`) stack vertically; selecting an item
  **pushes** the detail as a full-screen view with a back affordance.
- **Two-column forms → single column.** Create/edit, custom responses, export
  dialog reflow to one column; the "live preview" panel moves **below** the form.
- **Toolbars → overflow.** Dense action rows collapse non-primary actions into an
  **overflow (⋯) menu**; the 1–2 primary actions stay visible.

### 4.3 Touch & ergonomics

- **44×44px minimum touch targets**; primary actions (Copy URL, Send test, Pin,
  Replay) sit in **thumb reach** (bottom or sticky), not top corners.
- **No hover-only affordances.** Anything revealed on hover on desktop (row
  actions, shortcut hints) must have a tap-equivalent on mobile.
- **Bottom sheets** for menus/dialogs on mobile instead of center modals where it
  reads better (provider picker, export options, row actions).
- **Sticky context:** the endpoint URL + Copy stays reachable while scrolling the
  request list.

### 4.4 Content & input adaptations

- **JSON/payload viewer:** horizontal scroll within the pane (never break layout),
  collapsible tree, larger tap targets for expand/collapse, word-wrap toggle.
- **Code blocks / snippets:** horizontally scrollable with a one-tap **Copy**
  (copying matters more than reading every char on a phone).
- **Inputs:** correct `inputmode`/`type` (email for claim, url for forwarding,
  numeric for status/delay) so the right keyboard appears; avoid auto-zoom (≥16px
  font on inputs).
- **⌘K on mobile:** the command palette is reachable via a topbar **search button**
  (no keyboard); it doubles as endpoint search.

### 4.5 Live stream on mobile (Tier A, must be great)

- SSE stream works on mobile browsers; new requests animate in.
- **Auto-pause when backgrounded** (Page Visibility) to save battery/data; resume
  with a "N new" pill on return (reuses the Paused buffer from `05`).
- Reconnect with backoff; show a quiet "reconnecting…" rather than a dead screen.

### 4.6 Desktop-recommended hints (Tier C)

- For type-gen and MCP setup, show a **non-blocking** hint on small screens:
  "Easier on desktop — or copy this to continue." Never hard-block; always let the
  user proceed (copy/paste still works).

## 5. DX details — states

| State | Behavior |
|-------|----------|
| **Mobile nav** | Drawer sidebar; topbar search → ⌘K palette; breadcrumb truncates. |
| **Mobile list** | Cards, not tables; sticky primary action; pull-to-refresh optional. |
| **Mobile detail** | Full-screen push with back; sticky URL/Copy; bottom-sheet actions. |
| **Mobile form** | Single column; preview below; correct keyboards; sticky Save. |
| **Backgrounded live** | Auto-pause; "N new" on return. |
| **Tier-C on mobile** | Gentle "better on desktop" hint, never blocking. |

- **A11y on mobile:** maintains focus management on push/pop and bottom sheets;
  respects OS text-scaling; targets meet size minimums; live region still announces
  arrivals.
- **Performance:** the mobile core loop (list + viewer + stream) stays light;
  virtualize long lists; avoid shipping desktop-only heavy editors to mobile unless
  opened.

## 6. Acceptance criteria

- [ ] Every PRD declares its **mobile tier (A/B/C)**; Tier-A surfaces are fully
  usable on a phone.
- [ ] All data **tables collapse to cards** below 640px (endpoints, requests,
  tokens).
- [ ] **Master-detail** layouts (inspector, create, API client) stack/push on
  mobile with a clear back affordance.
- [ ] The **live SSE stream** works on mobile, auto-pauses when backgrounded, and
  resumes with a "N new" pill.
- [ ] **Touch targets ≥ 44px**; primary actions (Copy URL, Send test, Pin, Replay)
  are thumb-reachable; no hover-only actions.
- [ ] **⌘K palette** is reachable on mobile via a topbar search button.
- [ ] Inputs use correct `inputmode`/`type` and don't trigger zoom (≥16px).
- [ ] Code/snippet/JSON panes scroll horizontally without breaking layout and keep
  one-tap copy.
- [ ] Tier-C surfaces (type-gen, MCP setup) show a non-blocking "better on desktop"
  hint and still function.
- [ ] App passes a mobile **Lighthouse** pass (perf + a11y + PWA install, ties to
  `14`).

## 7. Success metrics

- Mobile share of sessions that complete the **core loop** (open endpoint → see a
  request → read payload / copy) without rage-taps or layout breakage.
- Mobile bounce on the inspector (should be low — Tier A).
- "Send test" + "Copy URL" usage on mobile (the on-the-go jobs).
- Mobile Lighthouse a11y/perf scores passing.

## 8. Out of scope

- A **native** iOS/Android app (PWA install in `14` is the mobile app story).
- Full feature parity for authoring-heavy flows on mobile (Tier B/C are
  intentionally "usable," not "optimized").
- Mobile-specific gestures beyond the basics (swipe-to-delete etc.) — nice future
  polish, not v1.

## 9. Open questions

1. **Tablet** treatment — does the sidebar stay as a rail (not a drawer) on tablet
   landscape? (Lean: rail on ≥768px landscape, drawer on phones.)
2. **Pull-to-refresh** on the request list (in addition to live stream) — expected
   gesture or redundant with SSE? (Lean: offer it; mobile users expect it.)
3. Should Tier-C surfaces offer a **"email me a link to finish on desktop"** option
   (e.g. MCP setup) for claimed users? (Lean: nice future; not v1.)
