# Webhook Catcher — Complete Feature & Architecture Documentation

> A modern webhook testing and debugging platform. Create endpoints, inspect
> incoming requests, replay/test payloads, and forward webhooks to multiple
> destinations — all **without signing up**.

This document explains every feature in the application in detail: how webhooks
are received and stored, how the "anonymous" user is created and persisted in
`localStorage`, how payloads are saved and displayed, and how every page, API
route, and data model fits together.

---

## 1. High-Level Overview

Webhook Catcher is a **Next.js 15 (App Router)** application written in
TypeScript. It gives developers a disposable, instantly-available webhook URL
that they can point any webhook provider (Stripe, GitHub, Shopify, etc.) at. The
app:

1. Generates a **unique anonymous user id (ULID)** the first time you visit and
   stores it in the browser's `localStorage` — no email, no password.
2. Lets you create named **endpoints**. Each endpoint gets a public URL of the
   form `/api/webhook/{userId}/{endpointName}`.
3. **Catches every HTTP request** sent to that URL (GET/POST/PUT/PATCH/DELETE),
   records the method, headers, query string, body, status code, and processing
   duration, then stores it in MongoDB.
4. Optionally **forwards** each received request to one or more downstream URLs
   ("forwarding URLs") so you can relay webhooks to your local/dev environment.
5. Provides a **dashboard** to browse endpoints, inspect request history,
   search/filter requests, export logs, replay/test payloads, and manage a
   lightweight profile (display name + avatar).

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15.3 (App Router, Turbopack dev) + React 19 |
| Language | TypeScript |
| Database | MongoDB via Prisma ORM (`generated/prisma/client`) |
| Styling | Tailwind CSS v4 + shadcn/ui (Radix primitives) |
| Data fetching (client) | SWR |
| Forms & validation | react-hook-form + Zod |
| Animations | Framer Motion |
| Toasts | react-hot-toast |
| Email (contact form) | Resend |
| IDs | `ulid` package |
| Analytics | Vercel Analytics |
| AI (dependency present) | `groq-sdk` (not yet wired into runtime code) |

### Environment Variables (`.env`)

| Key | Purpose |
|-----|---------|
| `DATABASE_URL` | MongoDB connection string used by Prisma |
| `NEXT_PUBLIC_RESEND_KEY` | API key for Resend (contact form email) |
| `GROQ_API_KEY` | Present for planned AI payload-analysis features |

---

## 2. Data Model (Prisma + MongoDB)

The schema lives in `prisma/schema.prisma`. The Prisma client is generated into
`generated/prisma/client` (not the default `node_modules` location) and is
instantiated as a singleton in `src/lib/prisma.ts` to avoid exhausting
connections during hot-reload in development.

```
User ──< Endpoint ──< Request
                  └──< ForwardingUrl
```

### `User`

| Field | Type | Notes |
|-------|------|-------|
| `id` | ObjectId | Mongo primary key (`_id`) |
| `userName` | String? | Optional display name (set on profile page) |
| `userId` | String (**unique**) | The **ULID** generated in the browser — this is the public identity used in URLs |
| `userImage` | String? | Avatar path |
| `endpoints` | Endpoint[] | Relation |
| `createdAt` / `updatedAt` | DateTime | Timestamps |

> **Key idea:** `userId` (the ULID) — *not* the Mongo `id` — is the relation key.
> Endpoints connect to a user via `userId`, and the webhook URL embeds it.

### `Endpoint`

| Field | Type | Notes |
|-------|------|-------|
| `id` | ObjectId | Primary key |
| `name` | String | URL-safe name (sanitized on create) |
| `description` | String? | Optional |
| `status` | String | `"active"` (default) or `"inactive"` |
| `createdAt` / `updatedAt` | DateTime | Timestamps |
| `lastActivity` | DateTime | Updated every time a webhook is received |
| `requestCount` | Int | Lifetime counter, incremented per request |
| `requests` | Request[] | Relation |
| `user` | User | Relation on `userId` with `onDelete: Cascade` |
| `forwardingUrls` | ForwardingUrl[] | Relation |

Indexed on `[userId, name]` — this is exactly the lookup the webhook handler
performs.

### `Request`

Every captured webhook is one `Request` row.

| Field | Type | Notes |
|-------|------|-------|
| `id` | ObjectId | Primary key |
| `endpointId` | ObjectId | FK to Endpoint (cascade delete) |
| `method` | String | HTTP method |
| `headers` | Json | All incoming headers |
| `body` | Json? | Parsed body (JSON or form-urlencoded) |
| `query` | Json? | Parsed query-string params |
| `statusCode` | Int | Response code we returned (always 200 today) |
| `response` | Json? | The response body we returned |
| `duration` | Int | Processing time in **milliseconds** |
| `createdAt` / `updatedAt` | DateTime | Timestamps |

### `ForwardingUrl`

| Field | Type | Notes |
|-------|------|-------|
| `id` | ObjectId | Primary key |
| `method` | String | Intended method (UI captures it; see note in §4) |
| `url` | String | Downstream destination |
| `endpointId` | ObjectId | FK to Endpoint (cascade delete) |

---

## 3. How the Anonymous User Works (localStorage + ULID)

This is the foundation that makes the app "no sign-up required."

### 3.1 `useLocalStorage` hook — `src/hooks/useLocalStorage.ts`

A thin, error-safe wrapper around the browser `localStorage` API. It is generic
(`useLocalStorage<T>(key)`) and returns three memoized functions:

- **`get()`** — reads `localStorage.getItem(key)`, returns `null` if missing,
  otherwise `JSON.parse`s it. Any error (e.g., SSR where `window` is undefined,
  or malformed JSON) is caught and logged, returning `null`.
- **`set(value)`** — `JSON.stringify`s the value and writes it.
- **`remove()`** — deletes the key.

All three are wrapped in `useCallback` keyed on `key`, so they're stable across
renders.

### 3.2 `useUser` hook — `src/hooks/useUser.ts`

This hook turns the raw localStorage access into an actual identity:

```ts
const { get, set } = useLocalStorage<{ id: string, imageUrl: string }>('user')
const [user, setUser] = useState(null)
const [loading, setLoading] = useState(true)

useEffect(() => {
  let user = get()
  if (!user || !user.id) {
    const newUser = { id: ulid(), imageUrl: `/avatar/zoro.jpg` }
    set(newUser)
    user = newUser
  }
  setUser(user)
  setLoading(false)
}, [])
```

**Step by step:**

1. On mount (client-side only, inside `useEffect`), it reads the `"user"` key
   from localStorage.
2. If nothing is stored (first visit) or the stored object has no `id`, it
   **generates a brand-new ULID** with `ulid()` and assigns a default avatar,
   then writes it back to localStorage with `set()`.
3. It stores the resulting user in React state and flips `loading` to `false`.

It returns `{ id, imageUrl, loading }`. The `id` is the ULID that travels through
the whole app — it becomes the `userId` in every URL and database row.

> **Why ULID instead of UUID?** ULIDs are lexicographically sortable and
> timestamp-prefixed, and they're URL-safe, which makes them ideal as the path
> segment `/dashboard/{userId}/...`.

### 3.3 Creating the user record in the database — `src/dashboard/action.ts`

The localStorage ULID only exists in the browser until the user visits their
dashboard. The dashboard page is a **server component** that calls the
`createOrGetUser` **server action**:

```ts
export async function createOrGetUser({ userId, userName, userImage }) {
  const existingUser = await prisma.user.findFirst({
    where: { userId },
    include: { _count: { select: { endpoints: { where: { status: "active" } } } },
              endpoints: { select: { id: true } } },
  });
  if (existingUser) return existingUser;

  const newUser = await prisma.user.create({ data: { userId, userName, userImage }, include: { ... } });
  return newUser;
}
```

**Behavior:**

- **Idempotent get-or-create:** it looks up a `User` by `userId` (the ULID). If
  found, returns it (with an active-endpoint count and the list of endpoint ids).
- If not found, it **creates** the row on the fly. This is how a "user" is
  persisted server-side the first time they reach the dashboard.
- On any Prisma error it returns `{ success: false, error, code, meta }` instead
  of throwing, so the page can render an error gracefully.

So the lifecycle is:

```
First visit ──▶ useUser generates ULID ──▶ stored in localStorage
                                              │
        clicks "Get Started" / opens dashboard│
                                              ▼
              /dashboard/{ULID} (server) ──▶ createOrGetUser() ──▶ User row in Mongo
```

The browser is the **source of truth for identity**; the DB row is created lazily
to anchor endpoints and requests.

---

## 4. How Webhooks Work (the core feature)

### 4.1 The catch-all webhook route — `src/app/api/webhook/[userId]/[name]/route.ts`

This single route file handles the entire webhook-receiving flow. It exports five
HTTP method handlers — `GET`, `POST`, `PUT`, `PATCH`, `DELETE` — and each one
simply delegates to a shared `handleWebhook(request, params)` function. That
means **any** of those methods sent to `/api/webhook/{userId}/{name}` is caught.

The full URL a user shares looks like:

```
https://<your-domain>/api/webhook/{userId}/{endpointName}
```

### 4.2 `handleWebhook` — step by step

```
startTime = Date.now()
```

1. **Look up the endpoint.** It queries Prisma for an endpoint matching both the
   `userId` and `name` from the URL, selecting only the `id` and the list of
   `forwardingUrls`. If no endpoint matches, it returns **404 `Endpoint not
   found`**.

2. **Parse the request.**
   - `headers` — `Object.fromEntries(request.headers.entries())` captures every
     header.
   - `method` — the HTTP verb.
   - `query` — parsed from the URL's `searchParams`.
   - `body` — content-type aware:
     - `application/json` → `await request.json()`
     - `application/x-www-form-urlencoded` → `request.formData()` flattened into
       an object
     - anything else (or a parse failure) → `null`

3. **Build the response object** that the sender will receive:
   ```json
   {
     "message": "Webhook received successfully",
     "timestamp": "<ISO timestamp>",
     "forwardingUrls": ["<url1>", "<url2>"]
   }
   ```

4. **Compute duration:** `Date.now() - startTime` (milliseconds).

5. **Persist atomically.** A `prisma.$transaction([...])` does two writes
   together:
   - `request.create({ ... })` — stores method, headers, query, body, response,
     `statusCode: 200`, and duration.
   - `endpoint.update({ ... })` — sets `lastActivity = now` and increments
     `requestCount` by 1.

   Using a transaction guarantees the request log and the counter stay in sync.

6. **Forward asynchronously (fire-and-forget).** If the endpoint has any
   forwarding URLs:
   - It clones the incoming headers and strips `host` and `content-length`
     (which must not be blindly forwarded).
   - It reconstructs the outgoing body:
     - `GET`/`HEAD` → no body
     - JSON → `JSON.stringify(body)`
     - form-urlencoded → `new URLSearchParams(body).toString()`
   - It calls `fetch()` to every forwarding URL inside `Promise.allSettled(...)`.
     **Crucially this is not `await`ed** — the handler does not wait for downstream
     responses, so a slow or failing destination never blocks (or fails) the
     webhook capture. Failures are caught and logged.

7. **Respond** with the response object and **HTTP 200**.

8. **Error handling.** Any thrown error is run through `parseError` (see §8) and
   returned as `{ error, code, meta }` with **HTTP 500**.

### 4.3 Forwarding caveat worth knowing

The `ForwardingUrl` model stores a `method` chosen in the UI, but the webhook
handler forwards using the **incoming** request's method, not the stored one. The
stored `method` is currently informational/display only.

### 4.4 What the sender sees vs. what you see

- **The webhook sender** gets back a small JSON acknowledgement (`200`).
- **You (the developer)** see the full captured request later in the dashboard's
  Request History, including headers, body, query, duration, and status.

---

## 5. How Payloads Are Saved & Displayed

### 5.1 Saving

Saving happens entirely inside the webhook handler (§4.2 step 5). Each incoming
call becomes one immutable `Request` document tied to its `Endpoint`. Bodies and
headers are stored as Mongo `Json`, so arbitrary nested payloads are preserved
verbatim.

### 5.2 Reading them back — `GET /api/endpoints/[id]`

When you open an endpoint detail page, the app fetches the endpoint **including**
its `requests` (ordered newest-first) and its `forwardingUrls`. Note a small
convenience: the route first tries to find the endpoint by **name**, and falls
back to finding it by Mongo **id**, so both forms of the URL resolve.

### 5.3 Displaying — `src/endpoints/request-list.tsx`

The `RequestList` component renders a table of captured requests. For each row:

- **Method badge** (colored via the `METHODS` map in `app-constant.ts`).
- **Status badge** — green/`default` for `< 400`, red/`destructive` otherwise.
- **Duration** in ms, and a human-friendly **time**.
- **Actions:** copy the body to clipboard, or delete that single request
  (`DELETE /api/requests/{id}`, then `mutate()` to refresh).

Clicking a row **expands** it (tracked in a `Set<string>` of expanded ids) to show
two `JsonDisplay` panels:

- **Headers** — passed through `filterHeaders()`, which removes noise listed in
  `unwantedHeaders` (`src/constant.ts`): Vercel infrastructure headers
  (`x-vercel-*`), proxy headers (`x-forwarded-*`, `x-real-ip`), `host`,
  `user-agent`, `content-length`, etc. This keeps the view focused on
  meaningful, sender-specific headers.
- **Body** — the raw payload.

`JsonDisplay` pretty-prints with `JSON.stringify(data, null, 2)`, truncates very
long payloads (> 500 chars) behind a **Show More / Show Less** toggle, offers a
**Copy** button, and renders inside a scrollable area.

---

## 6. Pages & Routes (UI walkthrough)

### Public / marketing pages
- `/` — Landing page (`src/app/page.tsx`) with the "Get Started" CTA
  (`src/home/get-started-btn.tsx`), which uses `useUser` to obtain the ULID and
  routes to `/dashboard/{userId}`.
- `/about-us`, `/pricing`, `/contact-us`, `/privacy-policy`,
  `/refund-policy`, `/terms-and-conditions` — static informational pages.

### Dashboard pages (`src/app/dashboard/...`)
- **`/dashboard/[userId]`** — the main dashboard (server component).
  - Calls `createOrGetUser` to ensure the DB row exists.
  - Shows metric cards: **Total Endpoints** (`_count.endpoints`, active),
    **Active Endpoints** (`endpoints.length`), plus **Success Rate** and **Avg
    Response Time** placeholders marked "To be implemented."
  - Renders `EndpointList` and a "Create Endpoint" button.
- **`/dashboard/[userId]/endpoint/create`** — endpoint creation form.
- **`/dashboard/[userId]/[id]`** — **endpoint detail** page (the richest screen,
  `src/app/dashboard/[userId]/[id]/page.tsx`). See §7.
- **`/dashboard/[userId]/[id]/edit`** — edit an existing endpoint.
- **`/dashboard/[userId]/setting/profile`** — profile editor (name + avatar).

### `EndpointList` — `src/endpoints/endpoint-list.tsx`
A client component that fetches endpoints with SWR (`useEndpoints(userId)` →
`GET /api/endpoints?userId=`). It renders a table with name, status badge,
request count, last activity, and created date. Row actions:
- **Edit** → navigates to the edit page.
- **Copy** → copies the full webhook URL
  (`{origin}/api/webhook/{userId}/{name}`) to the clipboard.
- **Delete** → `deleteEndpoint(id)` then `mutate()` to revalidate the list.

Clicking a row navigates to the endpoint detail page.

---

## 7. The Endpoint Detail Page in Depth

`src/app/dashboard/[userId]/[id]/page.tsx` is a client component packed with
features:

- **Param resolution:** `params` is a promise (Next 15), so it's awaited inside a
  `useEffect` and stored in state. The `?isNew=true` query param (set right after
  creation) auto-expands the Integration section.
- **Data:** `useGetEndpoint(param.id)` (SWR) loads the endpoint + requests +
  forwarding URLs.
- **Integration Details card:** shows the full webhook URL and a ready-to-run
  **sample cURL** command built from a sample `user.created` payload, each with a
  copy button. Collapsible via an animated eye toggle.
- **Forwarding URLs card:** lists each configured forwarding URL with its method
  and a copy button (only shown when forwarding URLs exist).
- **Metrics cards (computed client-side from the loaded requests):**
  - **Lifetime Requests** — `endpoint.requestCount`.
  - **Delivery Success Rate** — % of last-24h requests with `2xx` status
    (`calculateSuccessRate`).
  - **Average Response Time** — mean `duration` of last-24h requests
    (`calculateAvgResponseTime`).
  - **Last Webhook Activity** — `formatDistanceToNow(lastActivity)`.
- **Testing Playground toggle** → mounts `WebhookTestSection` (see §7.1).
- **Request History card:**
  - **Search box** — `filteredRequests` does a case-insensitive substring match
    against `JSON.stringify(req)`, so you can filter by method, status, body, or
    header content (`useMemo` over `endpoint.requests` + `searchQuery`).
  - **Refresh** — `mutate()` re-fetches.
  - **Export** — `handleExport()` serializes all requests to JSON and triggers a
    browser download named `webhook-requests-{name}-{date}.json` (via a Blob +
    temporary `<a>` element).
  - **Clear All** — `deleteAllRequests(endpointId)` →
    `DELETE /api/requests?endpointId=` → `mutate()`.
  - Empty states for "no requests yet" vs. "no matching requests."
  - Renders `RequestList` with the filtered set.

### 7.1 Webhook Testing Playground — `src/endpoints/webhook-test-section.tsx`

An in-app HTTP client to fire test requests at your own endpoint without leaving
the page (animated open/close via Framer Motion). Features:

- **Method** selector (POST/GET/PUT/DELETE/PATCH).
- **URL** field — read-only, pre-filled with the endpoint's webhook URL.
- **Dynamic headers** — add/remove arbitrary key/value header rows.
- **JSON payload editor** (hidden for GET) with a **Beautify** button that
  reformats via `JSON.parse`→`stringify(.., 2)` and validates JSON.
- **Send Request** — builds the fetch, auto-adds `Content-Type:
  application/json` if a body is present and none was set, sends it, and shows
  the **response** (status, statusText, parsed/raw body). Invalid JSON or network
  errors surface in an alert.

Because it posts to the real endpoint, sending a test request also creates a real
`Request` row you'll see in the history after refreshing.

---

## 8. API Reference (internal routes)

All under `src/app/api/`.

### Endpoints
| Method & Path | Purpose |
|---------------|---------|
| `POST /api/endpoints` | Create an endpoint. Requires `userId` + `name`; sanitizes the name (`spaces→-`, strips non `[a-zA-Z0-9_-]`), creates nested `forwardingUrls`, connects to user by `userId`. Returns 201. |
| `GET /api/endpoints?userId=` | List a user's endpoints, newest first. |
| `GET /api/endpoints/[id]` | Fetch one endpoint by **name** (fallback to **id**) including requests (desc) + forwarding URLs. |
| `PUT /api/endpoints/[id]` | Update an endpoint. Deletes all existing `forwardingUrls` then recreates from the payload (full replace). |
| `DELETE /api/endpoints/[id]` | Delete an endpoint (cascades to requests + forwarding URLs). |

### Requests
| Method & Path | Purpose |
|---------------|---------|
| `DELETE /api/requests/[id]` | Delete a single captured request. |
| `DELETE /api/requests?endpointId=` | Delete **all** requests for an endpoint ("Clear All"). |

### User profile
| Method & Path | Purpose |
|---------------|---------|
| `GET /api/user/profile?userId=` | Fetch the user record. |
| `PUT /api/user/profile` | Update `userName` and `userImage`. |

### Webhook (public)
| Method & Path | Purpose |
|---------------|---------|
| `GET/POST/PUT/PATCH/DELETE /api/webhook/[userId]/[name]` | The catch-all webhook receiver (§4). |

### Contact
| Method & Path | Purpose |
|---------------|---------|
| `POST /api/contact` | Validates name/email/subject/message, formats an HTML email, and sends it via **Resend** to the site owner with `replyTo` set to the submitter. |

### Client data layer — `src/endpoints/api/endpoints.tsx`
Wraps the above with SWR hooks and fetch helpers:
- `useEndpoints(userId)` / `useGetEndpoint(id)` — SWR hooks returning
  `{ endpoints, isLoading, isError, mutate }`.
- `deleteEndpoint`, `getEndpoint`, `deleteRequest`, `deleteAllRequests` — plain
  async fetch helpers. `mutate()` from SWR drives optimistic UI refreshes.

---

## 9. Creating & Editing Endpoints — `src/endpoints/endpoint-edit-form.tsx`

A single form component handles both **create** (no `id`) and **edit** (with
`id`), built on react-hook-form + Zod:

- **Validation schema:**
  - `name` — 3–50 chars, only `[a-zA-Z0-9_-]`, no `/`.
  - `description` — optional, ≤ 1000 chars.
  - `forwardingUrls` — array of `{ url (valid URL), method }`.
- **Random name generator** — the Sparkles button fills `name` with a random
  8-char slug.
- **Forwarding URLs** — managed with `useFieldArray`; add/remove rows, each with a
  URL input and a method `Select`.
- **Edit mode** — on mount, `getEndpoint(id)` loads current values and
  `form.reset(...)` populates the form.
- **Submit** — `POST` (create) or `PUT` (edit) to `/api/endpoints[/{id}]`, then
  routes to the detail page (`?isNew=true` on create to auto-open the Integration
  section).

---

## 10. Profile Management

`src/app/dashboard/[userId]/setting/profile/page.tsx` + `src/profile/api.tsx`:

- Uses `useUser()` to get the ULID, then `getProfile(id)` to load the current
  `userName`/`userImage`.
- A Zod-validated form lets you set a **username** (2–30 chars) and pick an
  **avatar** from a fixed set (`avatarFiles` in `src/constant.ts`, served from
  `/public/avatar/`) via a radio group.
- Saving calls `updateProfile(userId, userName, userImage)` →
  `PUT /api/user/profile`, with a success toast.

---

## 11. Cross-Cutting Concerns

- **Prisma singleton** (`src/lib/prisma.ts`) — one `PrismaClient` reused across
  hot reloads in dev via a `globalThis` cache.
- **Error parsing** (`src/lib/error.ts`) — `parseError()` normalizes Prisma
  errors (known request, validation, init, panic, unknown) and generic JS errors
  into `{ message, code?, meta? }`, used consistently across API routes.
- **Theming** — `ThemeProvider` (next-themes) defaults to **dark**, with system
  support; `globals.css` + Tailwind v4 + shadcn tokens.
- **Layout & SEO** — `src/app/layout.tsx` sets metadata, OpenGraph/Twitter cards,
  icons, fonts (Geist), mounts the global `Toaster`, and Vercel `Analytics`.
- **Shared UI** — `src/components/ui/*` is the shadcn component library;
  `enhanced-card.tsx`, `copy-button.tsx`, `custom-breadcrumb.tsx`,
  `header/footer`, etc. are app-specific wrappers.
- **Hooks** — `useBoolean` (toggle helper), `useLocalStorage`, `useUser`,
  `use-mobile`.

---

## 12. End-to-End Flow Summary

```
1. Visitor lands on "/" ──▶ useUser() mints a ULID ──▶ localStorage["user"]
2. Clicks "Get Started" ──▶ /dashboard/{ULID}
3. Server action createOrGetUser() ──▶ ensures a User row exists in MongoDB
4. User creates an endpoint ──▶ POST /api/endpoints ──▶ Endpoint row
5. Endpoint URL: /api/webhook/{ULID}/{name}  (copy button provided)
6. External provider sends a webhook ──▶ handleWebhook():
      • finds endpoint
      • parses method/headers/query/body
      • saves a Request + bumps requestCount/lastActivity (transaction)
      • fire-and-forget forwards to forwardingUrls
      • returns 200 acknowledgement
7. Developer opens endpoint detail ──▶ GET /api/endpoints/{id} (with requests)
      • inspects, searches, expands, copies, exports, replays, or clears logs
```

Identity is anchored in the browser (localStorage ULID), persistence lives in
MongoDB, and the webhook handler is the single hot path that captures, stores,
and relays every incoming request.
