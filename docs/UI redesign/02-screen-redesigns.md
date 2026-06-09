# 02 · Screen Redesigns

Page-by-page, mapping each **current route/file** to its **Emerald Console
redesign** (and the reference artboard in `webhook catcher/Relay - Emerald
Console.html`). Components referenced here are specified in `01`.

---

## 0. Navigation model

The sidebar nav maps to real routes (`Shell`, `01 §A`):

| Nav item | Route | Reference |
|----------|-------|-----------|
| Endpoints | `/dashboard/[userId]` | Endpoints list |
| Requests | `/dashboard/[userId]/requests` *(new)* | Live requests |
| Forwarding | (phase 2 — surfaces with `ForwardDelivery`) | — |
| Playground | `/dashboard/[userId]/playground` *(new top-level)* or per-endpoint | Playground |
| History | folds into Requests / per-endpoint history | — |
| Settings | `/dashboard/[userId]/setting/*` | (account dropdown) |

> The reference shows a **global Requests/Playground** in the sidebar. Today both
> are **endpoint-scoped** only. Decision in `../00-product-overview.md`: the
> endpoint playground stays as-is; a global Requests stream is a phase-2 add
> (needs the SSE work). Ship the redesign with sidebar items that route to what
> exists, and light up Requests/Forwarding as those features land.

---

## 1. Endpoints list (Dashboard)
> **Current:** `src/app/dashboard/[userId]/page.tsx` + `src/endpoints/endpoint-list.tsx`
> **Reference:** `Screens.jsx` `Dashboard()` — artboard "Endpoints · list"

- **Page head:** H1 "Endpoints" + sub + `EnvPill` ("Production · region"). Actions:
  `Export` (ghost) + `Create endpoint` (primary). Replaces the current header.
- **KPI row:** 4 `KpiCard`s — Total endpoints · Active now · Requests·24h · Avg
  response — first one `feature`-styled, each with a `Sparkline`.
  - ⚠️ **Use real numbers only.** Today's dashboard ships fake "Success Rate /
    Avg Response" placeholders (`../02-audit-and-roadmap.md §1.3`). Wire to real
    counters (Redis/rollup, `../02-audit §4`) or **hide** a card until it has
    data. No "To be implemented" in the redesigned UI.
- **Endpoints panel:** `Panel` "All endpoints" + count chip + `Segments`
  (All/Active/Paused) + Filter. Console `Table`:
  - Endpoint cell = status dot + `ServiceLogo` + name + mono path (`.ep`).
  - Status `StatusBadge`; Requests·7d = `num-cell` + inline `Sparkline`; Last
    activity (`mid`); Created (`dim`); `row-acts` (copy URL, open, more).
  - Row click → endpoint detail. Keep existing SWR (`useEndpoints`) + copy-URL +
    delete behavior from `endpoint-list.tsx`; only the markup/skin changes.

## 2. Endpoint detail
> **Current:** `src/app/dashboard/[userId]/[id]/page.tsx` (client, feature-rich)
> **Reference:** `emerald-screens.jsx` `EndpointDetail()` — artboard "Endpoint detail"

- **Detail head (`.dt-head`):** `ServiceLogo` (48px) + name + `StatusBadge` + mono
  URL with copy. Actions: Send test · Pause · more.
- **KPI row:** Requests·24h · Success rate · p95 latency · Forwarded (sparklines).
  Same "real data only" rule — these become honest once counters +
  `ForwardDelivery` exist (`../02-audit §4`). Until then show what's real
  (lifetime count, last activity) and omit the rest.
- **Two-col body (`.dgrid` 1fr/320px):**
  - **Left:** "Request volume" `Panel` + `AreaChart` (segmented 1h/24h/7d);
    "Recent requests" `Panel` (`Table` + `LiveTag`).
  - **Right:** "Forwarding to" `SumCard` (`ForwardResult` rows + `AddRow`);
    "Configuration" `SumCard` (`MetaList`: Method/Retention/Verify/Retry/Region/
    Created).
- **Migrate existing features** from the current page into this layout: Integration
  Details (URL + sample cURL via `CodeBlock`/`UrlBox`), the Testing Playground
  toggle (`WebhookTestSection`), and the **Request History** card (search +
  refresh + export + clear) — restyled as a `Panel` + console `Table`. **Add
  pagination** here (current page loads *all* requests — `../02-audit §1.1 #3`).
- **Retention UI hook:** per-request "expires in N days" chip + pin action land
  here (`../04-implementation-plan §B.1`).

## 3. Request inspector
> **Current:** the expand-row JSON view inside `src/endpoints/request-list.tsx`
> **Reference:** `emerald-screens.jsx` `RequestInspector()` — artboard "Request inspector"

This is a **new dedicated master–detail screen** (uses `.content.flex` full-height):

- **Left list (`.col-list`, 316px):** endpoint name + count + `LiveTag`; scrollable
  `reqitem` rows (method · path · time/ms · status code), selected = `accent-soft`.
- **Right detail (`.col-detail`):**
  - **Head:** `MethodPill` + path + `StatusPill lg` + ms + timestamp; actions
    cURL / Forward / **Replay** (primary).
  - **Strip:** `Chip`s — Source IP · Type · Size · Signature(verified) · Event.
  - **Body grid (`1fr/320px`):** left = `Tabs` (Body / Headers N / Query N) +
    `JsonView`; right `det-side` = "Forwarding" (`ForwardResult` + `StatusPill`)
    and "Response headers" (`KvList`).
- **Powers the roadmap UX:** rich payload viewer, replay, forwarding outcomes,
  diff-ready selection (`../02-audit §5.1`). Route suggestion:
  `/dashboard/[userId]/[id]/requests/[reqId]` or a global
  `/dashboard/[userId]/requests` with selection.

## 4. Live requests (global stream)
> **Current:** none (history is per-endpoint, manual refresh)
> **Reference:** `emerald-screens.jsx` `LiveRequests()` — artboard "Live requests"

- New route `/dashboard/[userId]/requests`. Page head + `EnvPill` + Pause/Export.
- **Filter bar (`.filterbar`):** search + Endpoint/Method/Status `fb-select`s +
  `LiveTag` ("live · N/s").
- **Stream `Panel` + `Table`:** Method · Endpoint (`ServiceLogo`+name) · Status
  pill · Latency · Size · Received · inspect arrow → opens the inspector.
- **Backed by SSE** (`/api/endpoints/:id/stream` / a user-wide stream) — the
  single highest-impact UX change (`../02-audit §5.1`). New-row arrival uses the
  highlight-fade motion (`00 §7`).

## 5. Playground
> **Current:** `src/endpoints/webhook-test-section.tsx` (endpoint-scoped, in detail page)
> **Reference:** `emerald-screens.jsx` `Playground()` — artboard "Playground"

- **Two-col (`.pg-grid` 1fr/380px):**
  - **Compose `Panel`:** Target endpoint `InputGroup`; Method + Content-Type
    `MethodSelect`s (`.field-row`); Headers via `KvEditor` + `AddRow`; Body
    `CodeEditor` (+ Beautify).
  - **Aside:** "Last response" `SumCard` (`RespStatus` + `CodeBlock`); "Templates"
    `SumCard` (`TemplateRow` per provider — Razorpay/Shopify/Stripe/GitHub);
    `Tip`.
- **Keep the endpoint-scoped playground** (locked URL) inside endpoint detail as
  today. The reference's free-target playground = the **new standalone API client**
  (`../04-implementation-plan §B.6`): same UI, editable arbitrary URL. Build the
  shared compose UI once; the locked vs. free URL is the only difference.

## 6. Create / Edit endpoint
> **Current:** `src/app/dashboard/[userId]/endpoint/create/page.tsx`,
> `.../[id]/edit/page.tsx`, both via `src/endpoints/endpoint-edit-form.tsx`
> **Reference:** `Screens.jsx` `CreateEndpoint()` — artboard "Create endpoint"

- **Two-col (`.form-wrap` 1fr/372px):**
  - **Form `Panel`:** Endpoint name `InputGroup` (prefix + sparkle suggest →
    existing random-name gen) + help; Description `textarea`; **Forwarding URLs**
    (`MethodSelect` + `InputGroup` + delete, `useFieldArray` as today) + `AddRow`;
    **Options** `opt-row` + `Switch` (Retain payloads / Verify signatures / Retry).
  - **Aside:** "Your endpoint URL" `UrlBox` + `MetaList`; "Test with cURL"
    `CodeBlock`; `Tip`.
  - Foot: note + Cancel + Create (primary, with check icon).
- Reuse the entire react-hook-form + Zod core from `endpoint-edit-form.tsx`;
  only swap presentation. Edit mode = same form, prefilled (unchanged logic).
- New option toggles (verify-signature, retry) are **UI-ahead** of backend; gate
  them behind the relevant roadmap features or mark clearly as inert until built
  (don't ship fake-functional switches).

## 7. Settings, Profile, Auth, Marketing

- **Profile** (`src/app/dashboard/[userId]/setting/profile/page.tsx`): re-skin the
  name + avatar form with console inputs/`SumCard`; fix the avatar
  double-prefix bug while here (`../02-audit §1.1 #9`).
- **Settings hub** (new, under `setting/`): houses the future **API tokens** and
  **"Connect an agent" (MCP)** panels (`../04-implementation-plan §B.4/§B.5`) and
  identity/email-claim (`§B.2`). Design these as `Panel` + `Table`/`MetaList` now
  so the feature work drops in.
- **Auth** (`/auth/verify` magic-link landing, `§B.2`): minimal centered card on
  the emerald `bg` — `SumCard` + primary button; no sidebar.
- **Marketing pages** (`/`, `/about-us`, `/contact-us`, policy pages): **out of
  scope for the console shell** but should adopt the emerald **tokens + fonts** so
  the brand is consistent. Re-skin `src/components/home/*`, `header.tsx`,
  `footer.tsx` with the new palette; keep their existing layout. The `pricing`
  page is already removed (all-free, `../00-product-overview.md`).

---

## 8. Empty, loading & error states

The reference shows populated screens; design the missing states (roadmap calls
out thin onboarding, `../02-audit §5.2`):

- **First-run / empty endpoints:** guided card — "Here's your URL → send a test →
  watch it land", with a live Send button and a first-capture celebration.
- **Empty request history** vs. **no search matches** (two distinct states — the
  current page already distinguishes these; keep that).
- **Loading:** shadcn `skeleton.tsx` shaped like the KPI row + table rows.
- **Error:** inset card with `danger` accent, reuse `parseError` messages
  (`src/lib/error.ts`).
