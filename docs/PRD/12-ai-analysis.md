# 12 · AI Payload Analysis (BYOK)

> **Primary persona:** AI-agent user · **Secondary:** Solo debugger, Integration builder
> **Phase:** 3 · **Cites:** `00-prd-overview.md` (principle 10), `../01-architecture.md §1` (groq-sdk present, unused),
> `09-identity-claim.md`, `10-settings-api-tokens.md`, `05-endpoint-detail-inspector.md`

---

## 1. Problem & why now

Debugging a webhook often means staring at a payload asking *"what is this, and why
did it fail?"* An LLM answers that instantly. We already ship `groq-sdk` as a
dependency but never wired it in (`../01-architecture.md §1`). Adding **AI payload
analysis** turns inspection into understanding and reinforces the agent-native
positioning — at **zero AI cost to us** via **BYOK** (bring your own API key).

## 2. Decision (locked)

- **BYOK only.** Users bring their own key. We never pay for inference.
- **Providers (v1):** **Groq, OpenAI, Anthropic** only.
- **In-app key-creation guides** for each provider, with **Groq highlighted for its
  generous free tier** (the recommended starting point).
- **Key storage:** **encrypted server-side for claimed users** (synced, AES-GCM);
  **anonymous users paste a key per session** (client-side, sent per call, never
  persisted) — see `09` gating and the security model below.
- **AI is contextual**, not a nav item: buttons in the inspector / on requests.
  Keys are managed in **Settings → AI keys** (`10`).

## 3. User stories

- As a user, I can click **"Explain this payload"** on a request and get a plain
  summary (what it is, key fields, likely provider/event).
- As a user, I can ask **"Why did this fail?"** and get a focused diagnosis (e.g.
  signature mismatch, missing field, wrong content-type).
- As a user, I can **summarize recent activity** for an endpoint ("3 failed Stripe
  events in the last hour").
- As a user, I add my **own provider key**; if I don't have one, an inline guide
  walks me through creating one — and recommends Groq's free tier.
- As a **claimed** user, my key is saved (encrypted) and synced; as an **anonymous**
  user, I paste it for the session.

## 4. Proposed experience

### 4.1 Entry points (contextual)

- **Request inspector:** `✨ Explain` and `Why did this fail?` actions (next to
  Copy/Replay/Pin in `05`).
- **Endpoint level:** `Summarize recent activity` on the detail/live view.
- First use with no key → inline **"Connect an AI provider"** card (links to the
  guide / Settings).

### 4.2 Provider picker + BYOK

```
AI analysis — choose a provider
  (•) Groq      ⚡ Free tier — recommended to start
  ( ) OpenAI
  ( ) Anthropic
  API key  [ •••••••••••••••• ]   [ How to get a key ▾ ]
  ☐ Save to my account (encrypted)   ← claimed users only
                                            [ Analyze ]
```

- **Claimed + "Save"**: key stored AES-encrypted, reused across sessions/devices.
- **Anonymous (or not saving):** key held in the browser for the session, sent with
  each call, **never persisted** server-side.
- Default selected provider = **Groq** with the free-tier nudge.

### 4.3 Key-creation guides (in-app)

Each provider has a short, copy-paste guide ("How to get a key ▾"):

- **Groq (recommended — generous free tier):**
  1. Go to **console.groq.com** and sign in.
  2. Open **API Keys** → **Create API Key**, name it, copy it.
  3. Paste it here. *Groq's free tier is generous and fast — the easiest way to
     start.*
- **OpenAI:**
  1. Go to **platform.openai.com** → **API keys**.
  2. **Create new secret key**, copy it (shown once).
  3. Note: OpenAI requires billing/credits; usage is paid.
- **Anthropic:**
  1. Go to **console.anthropic.com** → **API Keys**.
  2. **Create Key**, copy it.
  3. Note: requires credits/billing; usage is paid.

> Copy is provider-accurate but kept generic enough to survive minor UI changes;
> verify exact labels at build time. Always steer first-time users to **Groq** to
> remove the paywall from the first try.

### 4.4 What we send to the model

- The selected request's **redacted** payload (secret headers/fields stripped via
  the shared redaction list — `../02-audit §3.4`) + a focused system prompt per
  action (explain / diagnose / summarize).
- **Cost guardrails (BYOK courtesy):** cap input size (truncate large bodies with a
  note), cap output tokens, one request at a time. Show an estimate/disclaimer that
  this uses **their** key/credits.
- Model defaults per provider are sensible/cheap (e.g. a fast Groq model by
  default); advanced users can pick a model later (future).

### 4.5 Output

- Rendered as readable markdown next to the payload: a short summary, called-out
  key fields, and (for "why failed") a concrete hypothesis + suggested next step.
- A clear "AI-generated — verify before trusting" disclaimer.

## 5. DX details — states

| State | Behavior |
|-------|----------|
| **No key** | "Connect an AI provider" card + guide; Groq recommended. |
| **Key entered (anon)** | Works for the session; "paste again next time, or claim to save". |
| **Key saved (claimed)** | Reused silently; managed in Settings. |
| **Analyzing** | Streaming output if the provider supports it; skeleton otherwise. |
| **Provider error** | Surface the provider's message plainly (bad key, rate limit, no credits) with a fix hint. |
| **Oversized payload** | Truncate + note "analyzed first N KB; open full request for more". |

- **Security (principle 10):** keys encrypted at rest (claimed) via a server secret;
  never logged; never sent to anyone but the chosen provider; payloads redacted
  before sending; anonymous keys never persisted.
- **A11y:** key field is a labeled password input; output is readable text.

## 6. Acceptance criteria

- [ ] "Explain this payload", "Why did this fail?", and "Summarize recent activity"
  work against a captured request/endpoint using a BYOK key.
- [ ] Provider picker supports **Groq, OpenAI, Anthropic only**, default **Groq**
  with a free-tier recommendation.
- [ ] Each provider has an in-app **key-creation guide**; Groq's free tier is
  called out.
- [ ] **Claimed** users can save keys **encrypted** (synced); **anonymous** users
  use a per-session key that is **never persisted** server-side.
- [ ] Payloads are **redacted** before being sent to any provider; keys are never
  logged.
- [ ] Cost guardrails (input/output caps, one-at-a-time) are enforced; the UI states
  it uses the user's own credits.
- [ ] Provider errors (bad key / rate limit / no credits) are surfaced clearly.

## 7. Success metrics

- AI-action usage per active user (explain/why-failed/summarize).
- **Groq selection share** among first-time AI users (free-tier funnel working).
- Key-save rate among claimed users (claim incentive).
- Qualitative: faster "why did this fail" resolution.

## 8. Out of scope

- Providers beyond Groq/OpenAI/Anthropic (v1).
- We-pay / hosted inference (BYOK only).
- Model fine-tuning, multi-turn chat over payloads (single-shot analysis v1).
- Automatic analysis on every request (on-demand only, to respect user spend).

## 9. Open questions

1. **Model selection** per provider in v1, or fixed sensible defaults? (Lean: fixed
   cheap/fast defaults v1; advanced model picker later.)
2. Should "Summarize recent activity" run over the **live stream** continuously
   (agent-like watch) or strictly on demand? (Lean: on-demand v1 to protect spend;
   continuous is a future "AI watch" feature tying to `11`.)
3. Do we cache an analysis result on a request so re-opening doesn't re-spend?
   (Lean: yes — cache per (request, action, provider) for claimed users.)
