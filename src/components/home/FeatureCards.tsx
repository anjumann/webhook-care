import { History, Repeat2, ShieldCheck, Sparkles } from "lucide-react";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

/**
 * Feature story — Clause-style composition: one full-width glass card for the
 * core feature (the inspector), a 2-up row (the `wcat` relay to localhost with
 * an animated SVG path; replay/history), and a slim REST+MCP strip. Mocks are
 * static markup with light CSS/SMIL motion so the section stays a Server
 * Component.
 */

export function FeatureCards() {
  return (
    <section id="features" className="container mx-auto max-w-6xl px-4 py-20">
      <SectionHeading
        pill="Features"
        title="Built for the debugging loop"
        sub="Catch it, read it, fire it again — everything between “did it even send?” and “fixed” lives in one place."
      />

      <div className="mt-12 space-y-5">
        {/* core: the inspector */}
        <Reveal>
          <div className="glass grid gap-8 rounded-2xl p-7 md:grid-cols-2 md:p-10">
            <div className="flex flex-col justify-center">
              <h3 className="text-2xl font-bold tracking-tight">
                The whole request, the instant it arrives
              </h3>
              <p className="mt-3 text-mid">
                Method, headers, query, and a pretty-printed body — streamed to
                your dashboard the moment a service calls your URL. Unknown
                content types keep their raw text, so nothing is ever dropped.
              </p>
              <ul className="mt-5 space-y-2.5 text-sm text-mid">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" />
                  Secrets in headers are redacted before they’re stored
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  JSON, form data, and raw views side by side
                </li>
              </ul>
            </div>

            <InspectorMock />
          </div>
        </Reveal>

        {/* 2-up: forward + replay/history */}
        <div className="grid gap-5 md:grid-cols-2">
          <Reveal>
            <div className="glass flex h-full flex-col rounded-2xl p-7">
              <h3 className="text-xl font-bold tracking-tight">
                A bridge from the internet to :3000
              </h3>
              <p className="mt-2.5 text-sm text-mid">
                Run the <code className="font-mono text-[13px] text-primary">wcat</code> CLI
                and it holds an outbound connection to your catcher — nothing to
                expose, no ports to open, no tunnel to configure. Each capture is
                replayed to your local server the moment it lands.
              </p>
              <div className="glass-inset mt-4 rounded-lg px-3.5 py-2.5 font-mono text-[12px] text-mid">
                <span className="text-dim">$ </span>wcat listen{" "}
                <span className="text-accent2">--forward localhost:3000</span>
              </div>
              <ForwardGraphic />
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="glass flex h-full flex-col rounded-2xl p-7">
              <h3 className="text-xl font-bold tracking-tight">
                Fire it again, your way
              </h3>
              <p className="mt-2.5 text-sm text-mid">
                Thirty days of history, searchable and filterable. Replay any
                request as-is, or tweak the body and headers first. Pin the
                important ones and they never expire.
              </p>
              <ReplayMock />
            </div>
          </Reveal>
        </div>

        {/* slim strip: REST + MCP */}
        <Reveal>
          <div className="glass flex flex-col items-start gap-5 rounded-2xl p-7 md:flex-row md:items-center md:justify-between">
            <div className="max-w-md">
              <h3 className="text-xl font-bold tracking-tight">
                Ask your AI why the webhook failed
              </h3>
              <p className="mt-2 text-sm text-mid">
                Every capture is readable over a token-scoped REST API and a
                built-in MCP server. Plug it into Claude Code or Cursor and
                your agent pulls the exact request that broke — no pasting
                payloads into chat.
              </p>
            </div>
            <div className="glass-inset w-full max-w-sm rounded-xl px-4 py-3 font-mono text-[12px] text-mid">
              <span className="text-dim">$ </span>claude mcp add --transport
              http \
              <br />
              <span className="pl-4 text-primary">
                webhooks https://webhook.projext.in/api/mcp
              </span>{" "}
              \
              <br />
              <span className="pl-4">
                --header{" "}
                <span className="text-accent2">
                  &quot;Authorization: Bearer wcat_…&quot;
                </span>
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/** Static inspector mock — tabs, redacted header rows, JSON body. */
function InspectorMock() {
  return (
    <div className="glass-inset overflow-hidden rounded-xl">
      <div className="flex items-center gap-1 border-b border-border px-3 py-2">
        {["Body", "Headers", "Raw"].map((tab, i) => (
          <span
            key={tab}
            className={`rounded-md px-2.5 py-1 text-[11.5px] font-medium ${
              i === 0 ? "bg-accent-soft text-primary" : "text-dim"
            }`}
          >
            {tab}
          </span>
        ))}
        <span className="ml-auto flex items-center gap-1.5 font-mono text-[10.5px] text-dim">
          <span className="live-pulse" />
          200 · 41 ms
        </span>
      </div>
      <pre className="overflow-x-auto px-4 py-3.5 font-mono text-[12px] leading-relaxed text-mid">
        {`{
  "type": "payment_intent.succeeded",
  "data": {
    "amount": 4200,
    "currency": "usd",
    "customer": "cus_O8x…"
  }
}`}
      </pre>
      <div className="border-t border-border px-4 py-3 font-mono text-[11px] leading-loose text-dim">
        <div>
          content-type: <span className="text-mid">application/json</span>
        </div>
        <div>
          stripe-signature:{" "}
          <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold text-primary">
            redacted
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Animated SVG of the actual relay path: the public catcher on the left, and
 * `localhost:3000` living *inside* your machine — reached by the `wcat` client,
 * not pushed to by the server. The pulse is the captured request streaming down
 * the connection your machine opened, so there's no "server → naked localhost"
 * ambiguity.
 */
function ForwardGraphic() {
  const wire = "M 140 66 C 200 42, 236 42, 288 58";
  return (
    <svg
      viewBox="0 0 460 132"
      className="mt-auto w-full pt-6"
      role="img"
      aria-label="A captured webhook streams from the public catcher, down the outbound connection your machine opened, into the wcat CLI, which replays it to localhost:3000."
    >
      {/* the connection your machine dials out; captures stream back down it */}
      <path d={wire} fill="none" stroke="var(--border2)" strokeWidth="1" />
      <path d={wire} fill="none" stroke="var(--accent-line)" strokeWidth="1.5" className="dash-flow" />
      {/* one travelling packet (soft halo + bright lead) — CSS motion-path, so
          it stops under prefers-reduced-motion; the arrowhead keeps direction
          legible when it does. */}
      <circle r="6" fill="var(--accent2)" opacity="0.22" className="packet-flow" />
      <circle r="3" fill="var(--accent2)" className="packet-flow" />
      <path d="M 279 54 L 288 58 L 279 62 Z" fill="var(--accent-line)" />
      <text x="206" y="34" textAnchor="middle" fontSize="9" fontFamily="var(--font-mono)" fill="var(--faint)">
        outbound · no ports
      </text>

      {/* public catcher (the internet side) */}
      <rect x="6" y="50" width="132" height="32" rx="10" fill="var(--inset)" stroke="var(--border2)" />
      <text x="72" y="70" textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)" fill="var(--mid)">
        webhook.projext.in
      </text>

      {/* your machine: wcat pulls the stream and replays it to localhost */}
      <rect x="286" y="16" width="168" height="104" rx="14" fill="var(--inset)" stroke="var(--accent-line)" className="node-glow-soft" />
      <text x="370" y="33" textAnchor="middle" fontSize="9" fontFamily="var(--font-mono)" fill="var(--dim)">
        your machine
      </text>
      <rect x="302" y="42" width="136" height="28" rx="9" fill="var(--card)" stroke="var(--border2)" />
      <text x="370" y="60" textAnchor="middle" fontSize="10.5" fontFamily="var(--font-mono)" fill="var(--mid)">
        wcat listen
      </text>
      <path d="M 370 72 L 370 82" stroke="var(--border2)" strokeWidth="1.2" />
      <path d="M 366 80 L 370 86 L 374 80 Z" fill="var(--border2)" />
      <rect x="302" y="86" width="136" height="28" rx="9" fill="var(--card)" stroke="var(--accent-line)" className="node-glow" />
      <text x="370" y="104" textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill="var(--accent2)">
        localhost:3000
      </text>
    </svg>
  );
}

/** Replay/history mock — a capture row with replay affordance. */
function ReplayMock() {
  const rows = [
    { event: "orders/create", age: "2m" },
    { event: "payment_intent.succeeded", age: "1h", active: true },
    { event: "push · main", age: "1d" },
  ];
  return (
    <div className="glass-inset mt-auto space-y-1 rounded-xl p-2">
      {rows.map((row) => (
        <div
          key={row.event}
          className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 ${
            row.active ? "bg-accent-soft/60" : ""
          }`}
        >
          <span className="rounded bg-accent-soft px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary">
            POST
          </span>
          <span className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-foreground/90">
            {row.event}
          </span>
          <span className="font-mono text-[10px] text-faint">{row.age}</span>
          {row.active ? (
            <span className="flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[10.5px] font-semibold text-accentfg">
              <Repeat2 className="size-3" /> Replay
            </span>
          ) : (
            <History className="size-3.5 text-dim" />
          )}
        </div>
      ))}
    </div>
  );
}
