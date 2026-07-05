# 14 · PWA / Installable App

> **Primary persona:** All · **Secondary:** Solo debugger
> **Phase:** 3 · **Cites:** `00-prd-overview.md`, `../04-implementation-plan.md §B.7`

---

## 1. Problem & why now

Developers who use the tool daily benefit from an **installed app**: a dock/taskbar
icon, a standalone window without browser chrome, and instant launch. The
groundwork largely exists (`public/site.webmanifest` + icons), so this is a
low-effort, high-polish win. Scope is deliberately small: **installability + an
app-shell offline experience** — not offline data (webhook data is live and
per-user, so caching it offline adds little and risks staleness).

## 2. Decision (locked)

- **App-shell only** offline: cache the static shell (HTML/CSS/JS, icons, fonts) so
  the app **launches** offline and shows a graceful "you're offline" state; **do
  not** cache per-user webhook data.
- Installable to desktop + mobile, standalone window, app icon.

## 3. Target persona & jobs

- **All / daily users:** "Install Webhook Catcher like a real app and launch it in
  one click."

## 4. User stories

- As a user, I can **install** the app from the browser (desktop + mobile) and it
  opens in a **standalone window** with the app icon.
- As a user, if I open the installed app offline, it **launches** to a clear
  offline state rather than a dead browser error.
- As a user, when I'm back online, live data resumes normally.

## 5. Proposed experience

### 5.1 Manifest

- Verify/expand `site.webmanifest`: `name`, `short_name`, `theme_color`,
  `background_color` (match Emerald dark), `display: standalone`, `start_url`, full
  **icon set** (already present in `/public`), and maskable icons.

### 5.2 Service worker (app shell)

- Add a service worker (e.g. **Serwist/next-pwa** or hand-rolled) that **precaches
  the app shell** (static assets) and serves it offline.
- **Network-first for data**, cache-only for shell. **Never** cache `/api/*` data
  responses (live + per-user). On offline data fetch, show the offline state.
- Handle SW updates cleanly (prompt "new version available — reload" rather than
  silent stale shell).

### 5.3 Install prompt UX

- Capture `beforeinstallprompt`; show a subtle, **dismissible** "Install app"
  affordance (e.g. in the account menu or a one-time toast after repeat visits) —
  not an intrusive popup. Respect dismissal.
- iOS (no `beforeinstallprompt`): show brief "Add to Home Screen" instructions when
  appropriate.

### 5.4 Offline state

- A clean, branded offline screen: "You're offline — Webhook Catcher needs a
  connection to show live requests. We'll reconnect automatically." (Ties to the
  SSE reconnect behavior in `05`.)

## 6. DX details — states

| State | Behavior |
|-------|----------|
| **Installable** | Subtle, dismissible install affordance; respects dismissal. |
| **Installed** | Standalone window, app icon, no browser chrome. |
| **Offline launch** | Shell loads from cache → branded offline state. |
| **SW update** | "New version available — reload" prompt; no silent stale shell. |
| **Back online** | Live data + SSE resume automatically. |

- **A11y:** install affordance is a real button with a label; offline state is
  readable and announced.
- **No nag:** install prompt shown sparingly (repeat-visit heuristic), dismissible.

## 7. Acceptance criteria

- [ ] App passes the **Lighthouse PWA audit** (installable, manifest valid, SW
  registered).
- [ ] App can be **installed** on desktop and mobile and opens in a **standalone
  window** with the correct icon and theme color.
- [ ] Offline launch loads the **app shell** and shows a branded offline state;
  `/api/*` data is **never** served stale from cache.
- [ ] A dismissible **install affordance** appears (not an intrusive popup) and
  respects dismissal; iOS gets Add-to-Home-Screen guidance.
- [ ] SW updates prompt a reload rather than silently serving a stale shell.
- [ ] Back-online resumes live data + SSE automatically.

## 8. Success metrics

- Install count / installed-app launches (daily-user stickiness).
- Lighthouse PWA score = passing.
- Offline launches that recover cleanly (no dead-end errors).

## 9. Out of scope

- **Offline data** (caching webhook requests for offline reading) — live, per-user
  data; explicitly excluded.
- Push notifications for new requests (a tempting future feature; reserved with the
  topbar bell in `01`, not built here).
- Background sync / queued actions while offline.

## 10. Open questions

1. **SW tooling:** Serwist/next-pwa vs hand-rolled? (Lean: Serwist — modern,
   maintained, App-Router friendly.)
2. Should we eventually add **push notifications** for new captures (would make the
   bell in `01` real)? (Lean: out of v1; strong future candidate, pairs with SSE.)
3. Install affordance placement — account menu vs repeat-visit toast? (Lean: both,
   subtle; measure.)
