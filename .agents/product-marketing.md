# Product Marketing Context

*Last updated: July 5, 2026*

## Product Overview
**One-liner:** Catch, inspect, replay, and forward webhooks — free, no sign-up, and readable by your AI agent.
**What it does:** Webhook Catcher mints an instant webhook URL with no account required. Every request that hits it streams live into a console where you can inspect headers and payloads, replay requests (as-is or edited), and relay them to localhost or any other target. A token-scoped REST API and a built-in MCP server let AI agents (Claude Code, Cursor, etc.) read captures directly.
**Product category:** Webhook testing / debugging tool (the "webhook.site" shelf; adjacent to ngrok's inspect features).
**Product type:** Free SaaS (Next.js app at webhook.projext.in).
**Business model:** All-free today; no billing anywhere. Possible future paid tier — never advertise one until it exists.

## Target Audience

### Primary ICP — the AI-assisted builder ("developer who ships with an agent")
Solo devs, indie hackers, and small-team engineers who build with Claude Code, Cursor, or Copilot and integrate third-party services (Stripe, Clerk, Supabase, GitHub, Shopify, Resend). They know what a webhook is but debug them rarely enough that every incident feels like starting over. They already delegate debugging to their AI — a tool their agent can read via MCP fits their existing workflow instead of demanding a new one.
**Jobs to be done:**
- "Show me exactly what Stripe sent, right now, without deploying anything."
- "Get production webhooks to hit the code running on my laptop."
- "Let my AI agent see the failing request so it can fix my handler."

### Secondary ICP — the vibe coder
Non-traditional builders using Lovable/Bolt/v0/Claude to ship real products. They hit webhooks the first time they add payments or auth, and the concept is foreign — they can't tell "provider never sent it" from "my code broke." They need plain language, one-click flows, and provider samples. They are served through the same product (anonymous-first, zero jargon-free setup, the demo playground, MCP so *their agent* does the debugging) — not through a dumbed-down separate track.

### Anti-persona
Enterprise platform teams needing durable delivery guarantees, queues, retries, SLAs, or team workspaces (that's Hookdeck/Svix territory). Don't chase them; don't promise durability.

## Problems & Pain Points
**Core problem:** Webhooks fail invisibly. The sender and receiver disagree, and neither shows you the actual request.
**Why alternatives fall short:**
- webhook.site — ad-heavy, session-based URLs feel disposable-but-fragile, most useful features paywalled, no AI/agent story.
- ngrok — requires install + config, URL changes on restart (free tier), inspection is secondary to tunneling.
- RequestBin descendants — abandoned or minimal; short retention.
- Rolling your own logging endpoint — a deploy per print statement.
**What it costs them:** hours per integration; abandoned features (vibe coders often give up on payments entirely).
**Emotional tension:** feeling stupid in front of a "simple" integration; fear of breaking production payments.

## Differentiation
**Key differentiators:**
1. **MCP-native** — the only webhook catcher an AI agent can use as a first-class tool ("ask your AI why the webhook failed"). This is the wedge; lead with it.
2. **Free forever, no sign-up** — anonymous ULID identity; zero friction to first catch (<60s).
3. **Complete loop** — catch → inspect → replay (with edits) → forward to localhost, in one place.
4. **Trustworthy by default** — secret headers redacted at write time, 30-day auto-delete, analytics never sees payloads.

## Switching Dynamics (JTBD forces)
**Push:** ads and paywalls on webhook.site; ngrok setup ceremony; blind debugging.
**Pull:** instant URL, live console, agent integration.
**Habit:** muscle memory of `ngrok http 3000`; existing webhook.site bookmarks.
**Anxiety:** "will this tool still exist next month?", "is my payload data safe?" → answer with retention policy, redaction, and the free-forever stance.

## Customer Language
**Words to use:** "catch", "inspect", "replay", "forward to localhost", "see what Stripe actually sent", "your AI agent can read it", "free forever, no sign-up".
**Words to avoid:** "premium", "coming soon", "enterprise-grade", "AI-powered analysis" (we don't analyze payloads with AI — agents *read* captures via MCP; don't blur that), any pricing language.
**Glossary:** endpoint = the minted URL; capture/request = one received webhook; forwarding = relay to user-supplied target; MCP = Model Context Protocol server at /api/mcp; PAT = `wcat_` bearer token.

## Proof Points
- Product Hunt launch: ▲103 upvotes, real testimonials (Supa Liu, Joy Wang, Alex Cloudstar) — already on the landing page; keep quotes verbatim.
- <60s time-to-first-webhook is the activation metric (PostHog `first_webhook_received.seconds_since_create`).

## Brand Voice
**Tone:** confident, dry, developer-native; playful in verbs ("mint", "poke"), never in facts.
**Style:** short sentences, concrete nouns, no exclamation points, no buzzwords. Copy may assume terminal familiarity on the landing page but must stay readable to a vibe coder (name the tools they know: Stripe, Claude Code, Cursor).
**Personality:** precise, honest, quietly opinionated.

## Goals
**Business goal:** adoption + retention of free users; become the default "what did that webhook say" tool for AI-assisted builders.
**Key conversion action:** mint an endpoint and receive a first webhook (<60s); secondary: connect MCP / create a PAT.
**Current metrics:** PostHog wired (see docs/specs/16-analytics-posthog.md); marketing funnel events: `landing_cta_clicked`, `playground_sample_fired`, `contact_form_submitted`.

## Constraints for all marketing output
- The product is FREE — no pricing, refund mechanics, or "premium beta" language anywhere (legal pages were rewritten July 2026 to fix exactly this).
- Public name is **Webhook Catcher** everywhere (never "Webhook Care"; repo name `webhook-care` is internal).
- Live domain: `webhook.projext.in` — never advertise fictional domains (wcat.dev was removed from mocks).
- Never claim: team collaboration, AI payload analysis, open source. All false today.
- Support email: anjumanraj2@gmail.com (flagged: a branded address would look more credible).
