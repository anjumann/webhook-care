# 03 · Dashboard (Endpoints List + KPIs)

> **Primary persona:** Solo debugger · **Secondary:** Integration builder
> **Phase:** 1 · **Cites:** `00-prd-overview.md` (DX principle 3 — honest UI),
> `../02-audit-and-roadmap.md §1.3` (fake metrics), `../UI redesign/02-screen-redesigns.md §1`

---

## 1. Problem & why now

The dashboard is the home base. Today it shows **Total Endpoints** and **Active
Endpoints** (real) alongside **Success Rate** and **Avg Response Time** cards
marked *"To be implemented"* — i.e. **fake placeholders**. It also lists endpoints
in a table with no live signal of which are receiving traffic. Honest, useful KPIs
and a fast endpoint list are the baseline for trust (principle 3).

## 2. Target persona & jobs

- **Solo debugger:** "Show me my endpoints and which one just got a hit."
- **Integration builder:** "Give me an at-a-glance health/volume read across all
  my endpoints, and fast access to any of them."

## 3. User stories

- As a user, I see **only truthful** metrics — never a fabricated number.
- As a user, I can see request **volume over time** and **method distribution** at
  a glance.
- As a user, I can scan all my endpoints with status, recent volume, and last
  activity, and jump into any one in a click.
- As a user, I can copy any endpoint's URL or create a new one from here.
- As a user with live traffic, I can tell which endpoints are **active right now**.

## 4. Current-state gaps (→ `../02-audit-and-roadmap.md §1.3`)

- **Fake metrics:** Success Rate / Avg Response Time are placeholders; "Delivery
  Success Rate" is impossible without delivery records (forwarding is
  fire-and-forget, deferred — `../00-product-overview.md`).
- Metrics are computed **client-side over all loaded requests** — won't scale.
- No volume/trend visualization; no live activity signal.

## 5. Decision (locked) — truthful KPIs + volume/method viz

Show **only** what we can measure honestly from stored data. **No success-rate
card** until durable forwarding lands (phase 2+). Captured requests are stored as
`200` and forwarding isn't tracked, so neither "delivery success" nor an inbound
status split is real yet — we omit them rather than fake them.

### 5.1 KPI row (4 cards)

| KPI | Source | Truthful? |
|-----|--------|-----------|
| **Total endpoints** | `_count.endpoints` | ✅ |
| **Active endpoints** | status = active | ✅ |
| **Requests · 24h** (w/ sparkline) | count of requests in last 24h | ✅ |
| **Last activity** | max `lastActivity` across endpoints | ✅ |

Each card uses the Emerald `KpiCard` + `Sparkline` (`../UI redesign`).

### 5.2 Charts (below KPIs)

- **Requests over time (7d):** bar/area of captured requests per day — 100% real.
- **Method distribution:** GET/POST/PUT/PATCH/DELETE split across recent
  requests — real, and genuinely useful for spotting "why is this all GETs?".

> Metrics must be **server-computed** (counters/aggregations), not client-side over
> a full request load (`../02-audit §4` precomputed metrics). Until counters exist,
> compute via a bounded aggregation query, never by loading all requests.

### 5.3 Endpoints panel

- **Header:** "All endpoints" + count chip + segmented filter (All / Active /
  Paused) + a filter/search box.
- **Table columns:** Endpoint (status dot + optional service logo + name + mono
  path), Status badge, **Requests · 7d** (number + inline sparkline), Last
  activity, Created, row actions (copy URL, open, more).
- **Row click → endpoint detail.** Keep the existing SWR (`useEndpoints`),
  copy-URL, and delete behavior; only the skin + columns change.
- **Live activity:** endpoints receiving requests right now show a subtle pulse on
  their status dot (ties to SSE; cheap heartbeat is acceptable if full SSE per-row
  is too heavy).

### 5.4 Page actions

- Primary: **Create endpoint** (→ `04`). Secondary: **Export** (→ `08`, may be
  gated by claim).

## 6. DX details — states

| State | Behavior |
|-------|----------|
| **Empty** (no endpoints) | Should rarely happen due to auto-create (`02`); if it does, a single "Create your first endpoint" CTA + one-line teach. |
| **Loading** | Skeleton KPI cards + skeleton table rows (no layout shift). |
| **Error** | "Couldn't load your dashboard — Retry"; KPIs and table fail independently. |
| **Populated** | KPIs + charts + table; live pulses on active endpoints. |

- **Keyboard:** ↑/↓ moves row selection; Enter opens; `c` copies URL of the
  selected row; ⌘K "New endpoint".
- **Honest empty data:** if there are endpoints but zero requests, charts show a
  clean "No requests in this window yet" state, not a broken axis.
- **Mobile:** table collapses to cards (name + status + 24h count + last activity).
- **A11y:** status as dot **+ text**; sparklines have an accessible label with the
  number.

## 7. Acceptance criteria

- [ ] The dashboard shows the four §5.1 KPIs and **no** success-rate / avg-response
  card and **no** "To be implemented" text anywhere.
- [ ] Requests·24h and Requests·7d are computed **server-side** (aggregation or
  counters), not by loading all requests client-side.
- [ ] Requests-over-time and method-distribution charts render from real stored
  data and degrade gracefully with zero data.
- [ ] Endpoints table shows status, 7d volume + sparkline, last activity, created,
  and row actions; row click opens detail.
- [ ] Copy-URL and delete from a row still work (parity with today).
- [ ] Active endpoints show a live pulse when receiving traffic.
- [ ] All four states (§6) implemented; mobile collapses to cards.

## 8. Success metrics

- 0 fake/placeholder metrics shipped (hard gate).
- Dashboard → endpoint-detail click-through is the dominant path (validates the
  list as a launchpad).
- Dashboard load p75 stays flat as request volume grows (proves server-side
  metrics).

## 9. Out of scope

- **Delivery success rate / avg delivery time** — needs `ForwardDelivery` records
  (deferred; would reverse the "forwarding stays as-is" decision).
- Per-endpoint inbound status split — not meaningful until Custom Responses (`06`)
  make stored status codes vary.
- Cross-endpoint analytics / date-range pickers beyond the 7d/24h defaults.

## 10. Open questions

1. **Service logos:** auto-detect provider from headers/UA (Stripe, GitHub…) to
   show a logo in the endpoint cell? (Lean: yes as a delighter, best-effort, never
   blocking.)
2. Do we add a **"Requests · 7d" trend delta** (▲/▼ vs prior week)? (Lean: yes,
   cheap and useful.)
3. Live pulse: true per-endpoint SSE vs a periodic lightweight heartbeat? (Lean:
   heartbeat on the list; full SSE reserved for the detail/live-requests view.)
