import { History, Repeat2, ShieldCheck, Sparkles } from "lucide-react";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

/**
 * Feature story — Clause-style composition: one full-width glass card for the
 * core feature (the inspector), a 2-up row (forward-to-localhost with an
 * animated SVG path; replay/history), and a slim REST+MCP strip. Mocks are
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
                Add a forwarding URL and every capture is relayed to your
                machine as it lands — webhooks from production services, hitting
                the code in your editor.
              </p>
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
                Queryable from code — and from your agent
              </h3>
              <p className="mt-2 text-sm text-mid">
                Every capture is reachable over a token-scoped REST API and a
                built-in MCP server. Your AI agent can read the webhook that
                just failed and tell you why.
              </p>
            </div>
            <div className="glass-inset w-full max-w-sm rounded-xl px-4 py-3 font-mono text-[12.5px] text-mid">
              <span className="text-dim">$ </span>curl -H{" "}
              <span className="text-accent2">&quot;Authorization: Bearer wcat_…&quot;</span>
              {" \\"}
              <br />
              <span className="pl-4 text-primary">
                https://wcat.dev/api/v1/requests
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

/** Animated SVG: endpoint → travelling pulse → localhost. */
function ForwardGraphic() {
  const path = "M 70 56 C 170 12, 290 12, 390 56";
  return (
    <svg viewBox="0 0 460 110" className="mt-auto w-full pt-6" aria-hidden>
      <path d={path} fill="none" stroke="var(--border2)" strokeWidth="1" />
      <path
        d={path}
        fill="none"
        stroke="var(--accent-line)"
        strokeWidth="1.5"
        className="dash-flow"
      />
      <circle r="6" fill="var(--accent2)" opacity="0.25">
        <animateMotion dur="1.8s" repeatCount="indefinite" path={path} />
      </circle>
      <circle r="3" fill="var(--accent2)">
        <animateMotion dur="1.8s" repeatCount="indefinite" path={path} />
      </circle>

      <rect x="14" y="42" width="112" height="32" rx="10" fill="var(--inset)" stroke="var(--border2)" />
      <text x="70" y="62" textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill="var(--mid)">
        wcat.dev/u/…
      </text>

      <rect x="334" y="42" width="112" height="32" rx="10" fill="var(--inset)" stroke="var(--accent-line)" />
      <text x="390" y="62" textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill="var(--accent2)">
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
