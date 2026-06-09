# 01 · Sidebar & Shell

> **Primary persona:** All · **Secondary:** Solo debugger
> **Phase:** 1 · **Cites:** `00-prd-overview.md` (DX principles 5, 6, 11, 12),
> `../UI redesign/00-design-language.md` (shell metrics), `../UI redesign/02-screen-redesigns.md §0`

---

## 1. Problem & why now

Today the dashboard is a **centered, top-header layout** (`src/app/dashboard/layout.tsx`
→ `max-w-7xl mx-auto` + `<Header/>`). It doesn't scale to the surfaces we're adding
(endpoints, live requests, playground, integrations, API client, agents, settings),
has no global navigation, no command palette, and no persistent account/identity
affordance. The Emerald Console redesign already calls for a **full-height sidebar
console**; this PRD specs the *experience* of that shell — navigation IA, the
topbar, and the ⌘K palette — so every other surface has a consistent frame.

The shell is the first thing every persona touches and the frame the whole product
lives in. It must feel like a modern developer console (Vercel/Linear), not a
marketing site with a dashboard bolted on.

## 2. Target persona & jobs

- **All personas:** "Get me to the thing I want in one keystroke or one click."
- **Solo debugger:** "Don't make me hunt — my endpoints and the live stream are
  right there."
- **Integration builder:** "Let me jump between my many endpoints fast."

## 3. User stories

- As any user, I can see where I am and reach any major surface from a persistent
  sidebar.
- As any user, I can press **⌘K / Ctrl-K** anywhere and run a primary action
  (new endpoint, copy URL, switch endpoint, clear requests, toggle theme, claim
  account) by typing.
- As an integration builder with many endpoints, I can **expand "Endpoints" in the
  sidebar** to jump straight to a specific endpoint, and that list only loads when
  I open it (no wasted fetch on every page).
- As any user, I can see my identity state (anonymous vs claimed) and act on it
  from the account area without it nagging me.
- As a mobile user, the sidebar collapses to a drawer and the app stays usable.

## 4. Current-state gaps (→ `../02-audit-and-roadmap.md`)

- No global nav; navigation is via in-page buttons and breadcrumbs.
- No command palette (though `cmdk` is already a dependency).
- Identity (anonymous ULID) has no UI surface — users can't tell they're anonymous
  or claim their dashboard.
- Centered layout wastes horizontal space and can't host a master-detail inspector.

## 5. Proposed experience

### 5.1 Layout (from the Emerald Console)

```
┌──────────┬─────────────────────────────────────────────┐
│ sidebar  │ topbar (breadcrumb · ⌘K · theme · 🔔 · acct) │
│ 236px    ├─────────────────────────────────────────────┤
│ brand    │                                             │
│ nav      │  content (radial emerald glow, 26/32 pad)   │
│ groups   │                                             │
│ account  │                                             │
└──────────┴─────────────────────────────────────────────┘
```

Metrics (sidebar 236px, topbar 56px, content padding 26/32) come from
`../UI redesign/00-design-language.md §5`. This PRD owns *behavior*, that doc owns
*pixels*.

### 5.2 Sidebar IA — **grouped**

```
┌ brand: ⬡ Webhook Catcher ───────────┐

  INSPECT
   ▸ Endpoints            ⌄  (expandable, lazy)
       · swift-otter
       · stripe-prod
       · github-ci
   ▸ Live Requests
   ▸ Playground

  CONNECT
   ▸ Integrations
   ▸ API Client
   ▸ Agents & MCP

└─────────────────────────────────────┘
  account ▾   (anonymous · Claim →)
   Settings · Theme · Sign in
```

- **Two labeled groups** in the scrollable middle: **INSPECT** (Endpoints, Live
  Requests, Playground) and **CONNECT** (Integrations, API Client, Agents & MCP).
- **Endpoints is an expandable group.** Collapsed by default. **On expand, lazily
  fetch the user's endpoints** (SWR, `useEndpoints`) and render them as sub-items
  for fast switching; show the active one highlighted. Collapsed state and the
  fetched list are cached for the session. A "+ New endpoint" sits at the bottom
  of the expanded list.
- **Account footer:** identity chip (avatar + "anonymous" or email), a menu →
  Settings, theme toggle, and "Sign in / Claim". This is the *only* persistent
  identity surface; it never nags (see `09-identity-claim`).
- **AI analysis is NOT a nav item** — it's contextual (buttons in the inspector /
  on requests). **AI keys live in Settings** (`10`).

### 5.3 Collapse behavior

- Desktop: sidebar can collapse to an **icon-only rail**; labels appear as
  tooltips on hover (keep ARIA labels). **Collapse state persists** across sessions
  (separate desktop/mobile state).
- Mobile: off-canvas **drawer**, triggered from the topbar; content goes full-width.

### 5.4 Topbar

Contextual to the current view, not global nav:
- **Left:** breadcrumb (e.g. `Endpoints / stripe-prod`).
- **Center/right:** **⌘K search/command** trigger (shows the shortcut hint),
  **theme** toggle, **notifications** bell (reserved; quiet in v1), **account**.
- Page-specific primary actions (e.g. "Create endpoint", "Copy URL") render in the
  **page head**, not the topbar, to keep the topbar stable.

### 5.5 Command palette (⌘K, `cmdk`)

Opens on ⌘K/Ctrl-K from anywhere; type to fuzzy-search; ↑/↓ to move; Enter to run;
Esc to close. Action groups:
- **Navigate:** go to Endpoints / Live Requests / Playground / Integrations / API
  Client / Agents / Settings.
- **Endpoints:** jump to endpoint *(by name)*, New endpoint, Copy this endpoint's
  URL, Copy as curl, Clear requests.
- **Actions:** Toggle theme, Claim/Sign in, Open docs.
- Each item shows its **keyboard shortcut** where one exists (discovery
  mechanism, per research / Linear).

### 5.6 States

| State | Behavior |
|-------|----------|
| Endpoints group collapsed | No fetch; chevron + count badge if cheaply known, else just label. |
| Endpoints group expanding | Skeleton rows while the lazy fetch resolves. |
| Endpoints empty | Expanded group shows "No endpoints yet — Create one". |
| Anonymous identity | Footer chip reads "Anonymous", menu offers "Claim your dashboard". |
| Claimed identity | Footer chip shows email/avatar; menu offers "Sign out / everywhere". |
| Mobile | Sidebar is a drawer; ⌘K still available via a topbar search button. |

## 6. DX details

- **Keyboard:** ⌘K everywhere; `g e` / `g r` style "go to" chords are a
  nice-to-have (note, not required v1). Focus is trapped in the palette and the
  mobile drawer; Esc closes and restores focus.
- **Empty:** the Endpoints group teaches "Create one"; never a bare blank.
- **Loading:** skeleton sidebar items, never a spinner that shifts layout.
- **Error:** if the lazy endpoint fetch fails, show "Couldn't load endpoints —
  Retry" inline in the group; the rest of the shell stays usable.
- **A11y:** sidebar is a `nav` landmark; groups are labeled; active item has
  `aria-current`; collapsed rail items keep accessible names via tooltip labels.

## 7. Acceptance criteria

- [ ] App renders in the sidebar-console shell on every authenticated route.
- [ ] Sidebar shows INSPECT and CONNECT groups with the items listed in §5.2.
- [ ] Endpoints group is collapsed by default and **fetches its list only on first
  expand**; the result is cached for the session.
- [ ] ⌘K/Ctrl-K opens the command palette from any screen; all §5.5 actions work;
  Esc closes and restores focus.
- [ ] Sidebar collapses to an icon rail on desktop with tooltip labels; state
  persists across reloads.
- [ ] On mobile (<768px) the sidebar is a drawer and content is full-width.
- [ ] Account footer reflects anonymous vs claimed state and exposes Settings,
  theme, and claim/sign-in — with no nagging banner.
- [ ] Theme toggle persists and defaults to dark.
- [ ] All four states in §5.6 are implemented.

## 8. Success metrics

- ⌘K usage: ≥ 30% of weekly active users open the palette.
- Endpoint-switch via sidebar/palette is the dominant nav method for users with ≥3
  endpoints.
- Zero "where do I find X" confusion in usability checks for the 7 top tasks.

## 9. Out of scope

- Project/workspace switching beyond endpoints (no teams in the all-free model).
- Notifications system behind the bell (reserved, quiet placeholder only).
- `g`-chord shortcuts (nice-to-have, not v1).

## 10. Open questions

1. Should the expanded Endpoints list be **searchable inline** when a user has
   many (>15), or do we rely on ⌘K for that? (Lean: rely on ⌘K, cap inline list
   height with scroll.)
2. Do we show a small **live activity dot** on the Endpoints group / Live Requests
   item when new requests are arriving? (Lean: yes — subtle pulse, ties to SSE.)
