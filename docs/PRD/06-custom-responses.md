# 06 · Custom Responses

> **Primary persona:** Integration builder · **Secondary:** Solo debugger
> **Phase:** 2 · **Cites:** `00-prd-overview.md`, `../01-architecture.md §4` (ingest, statusCode hard-coded 200),
> `../02-audit-and-roadmap.md §1.1 #8`

---

## 1. Problem & why now

Today the webhook handler **always returns `200`** with a fixed JSON ack
(`statusCode` is hard-coded — `../02-audit §1.1 #8`); the README promised custom
status codes, response bodies, headers, and delays but none exist. This matters for
real integrations:
- Many providers run a **verification handshake** (e.g. Slack URL verification
  echoes a `challenge`; some expect specific status codes) — without custom
  responses, you can't complete setup.
- Developers want to **simulate** how their system reacts to non-200s, slow
  responses, or specific headers.

It's also a prerequisite for the dashboard ever showing a meaningful inbound status
split (`03`). Cheap to build, high credibility.

## 2. Target persona & jobs

- **Integration builder:** "Make my endpoint return exactly what this provider's
  verification expects, and let me simulate failures/delays."
- **Solo debugger:** "Return a 500 with a delay so I can test my retry logic."

## 3. Decision (locked) — static per-endpoint response, no rules engine

v1 is a **single static response config per endpoint**: status code, body,
headers, and an optional delay. **No conditional/rules engine** (no "if path X
return Y") in v1 — that's explicitly future. Keep it simple and obviously correct.

## 4. User stories

- As a user, I can set my endpoint's response **status code** (default 200).
- As a user, I can set a **response body** (raw text or JSON) and **headers**.
- As a user, I can add a **delay** (ms) before the response is sent, to simulate
  slow systems.
- As a user, I can use **template variables** for verification handshakes (e.g.
  echo back a field like `{{body.challenge}}`).
- As a user, the captured request stores the **actual status code we returned**, so
  history reflects reality (not always 200).

## 5. Proposed experience

### 5.1 Config surface

A section in create/edit (`04`) and a quick-edit on the detail page:

```
Custom response
  Status   [ 200 ▾ ]      Delay  [ 0 ] ms
  Headers  ┌ key            value           ✕ ┐
           │ content-type   application/json   │
           └ + add header                       ┘
  Body     ┌ {  "ok": true }                  ┐  [JSON ▾] [Beautify]
           └─────────────────────────────────┘
  ☐ Echo a field for verification:  {{ body.challenge }}
  Preview: 200 · application/json · "{ \"ok\": true }"
```

### 5.2 Template variables (verification)

A small, safe substitution set so handshakes work without a scripting engine:
- `{{body.<path>}}`, `{{query.<key>}}`, `{{headers.<name>}}`.
- Used most for Slack-style URL verification (echo `challenge`). Document examples
  inline.
- Substitution is **string-only, sandboxed** (no arbitrary code) — not a
  transformation engine.

### 5.3 Ingest changes

- The handler returns the configured status/body/headers after the optional delay,
  instead of the hard-coded 200 ack.
- The stored `Request.statusCode` / `Request.response` reflect **what we actually
  returned**, making history and any future status metrics truthful.
- **Guardrails:** delay capped (e.g. ≤ 10s to stay within function limits); body
  size capped; headers denylist (can't set hop-by-hop/unsafe headers).

## 6. DX details — states

| State | Behavior |
|-------|----------|
| **Default** | 200 + standard ack; shown read-only until the user customizes. |
| **Editing** | Live preview of status + content-type + body; JSON validated + beautify. |
| **Invalid** | Inline errors (bad JSON, status out of range, delay over cap). |
| **Saved** | Confirmation; next captured request reflects the new response. |

- **Keyboard:** Beautify and Save reachable; ⌘↵ saves.
- **A11y:** labeled fields; preview has accessible text.
- **Safety:** clearly mark that custom 4xx/5xx responses are *intentional* so the
  inspector doesn't misread them as errors.

## 7. Acceptance criteria

- [ ] An endpoint can be configured to return a custom status, body, headers, and
  delay; the live ingest returns exactly that.
- [ ] `Request.statusCode` and `Request.response` store the **actual** returned
  values (no longer always 200).
- [ ] Template variables (`{{body.x}}`, `{{query.x}}`, `{{headers.x}}`) substitute
  correctly and are sandboxed (no code execution).
- [ ] Slack-style URL verification (echo `challenge`) is achievable and documented
  with an inline example.
- [ ] Delay, body size, and header denylist guardrails enforced.
- [ ] Config is ownership-checked (`requireOwner`) and saved atomically with the
  endpoint.

## 8. Success metrics

- Endpoints using a non-default response (adoption among integration builders).
- Successful provider verification handshakes completed in-tool.
- Reduction in "it always returns 200, I can't verify" support/feedback.

## 9. Out of scope

- **Conditional rules** ("if header X then response Y") — future.
- Per-method or per-path responses — future.
- Full scripting/transformation (webhook.site WebhookScript–style) — future.
- Mock-API generation — out of product scope.

## 10. Open questions

1. Should custom responses be **per-method** (different response for GET vs POST)
   even in v1, or strictly one static response? (Lean: one static v1; per-method is
   the first follow-up.)
2. Do we offer **preset responses** (e.g. "Slack verification", "Stripe 200 ack",
   "Simulate 500") as one-click templates? (Lean: yes — small library, big UX win.)
