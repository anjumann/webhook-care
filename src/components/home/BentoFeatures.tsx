import {
  BarChart2,
  List,
  Terminal,
  FlaskConical,
  Cloud,
  Laptop,
  ArrowRight,
} from "lucide-react";
import { Reveal } from "./Reveal";

/**
 * Feature bento — one asymmetric grid that replaces the two old feature
 * sections. Colorful but on-brand: solid gradient tiles (metrics, forwarding)
 * anchor it, a neutral mock tile shows the inspector, and the icon tiles use
 * the chart ramp (teal / lime / amber) for variety. Red stays reserved.
 */
export function BentoFeatures() {
  return (
    <section className="container mx-auto px-4 py-16 lg:py-24">
      <Reveal>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Everything you need to debug webhooks
          </h2>
          <p className="mt-3 text-lg text-mid">
            Capture, inspect, replay, and forward — one clean workspace, no
            tooling to install.
          </p>
        </div>
      </Reveal>

      <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">
        {/* A — big neutral mock: inspect */}
        <Reveal className="md:col-span-2" delay={0.05}>
          <div className="flex h-full flex-col rounded-xl border border-border bg-elev p-6">
            <h3 className="text-lg font-semibold">See every detail, instantly</h3>
            <p className="mt-1.5 text-sm text-mid">
              Full headers, pretty-printed bodies, status and timing — captured
              the moment it lands.
            </p>
            <div className="mt-5 overflow-hidden rounded-lg border border-border bg-inset">
              <div className="flex items-center justify-between border-b border-border px-3.5 py-2">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-accent-soft px-1.5 py-0.5 font-mono text-[11px] font-semibold text-primary">
                    POST
                  </span>
                  <span className="font-mono text-[11.5px] text-mid">
                    /abc123
                  </span>
                </div>
                <span className="font-mono text-[11px] text-dim">42ms</span>
              </div>
              <pre className="overflow-x-auto px-3.5 py-3 font-mono text-[11.5px] leading-relaxed text-mid">
                {`content-type: application/json
x-signature: t=1718…,v1=9f2a…

{ "event": "payment.succeeded", "amount": 4200 }`}
              </pre>
            </div>
          </div>
        </Reveal>

        {/* B — solid teal→emerald gradient: real-time metrics */}
        <Reveal className="md:col-span-1" delay={0.1}>
          <div className="flex h-full flex-col justify-between rounded-xl bg-gradient-to-br from-c2 to-primary p-6 text-white">
            <BarChart2 className="size-6 opacity-90" strokeWidth={1.8} />
            <div className="mt-6">
              <div className="font-mono text-4xl font-bold tabular-nums">1,284</div>
              <div className="mt-1 text-sm opacity-90">requests today</div>
              <p className="mt-3 text-sm opacity-80">
                Live counts, success rates and response times per endpoint.
              </p>
            </div>
          </div>
        </Reveal>

        {/* C — lime tint: history */}
        <IconTile
          delay={0.05}
          icon={List}
          title="Complete history"
          body="Every request kept for 30 days, searchable and filterable by method or status."
          surface="bg-c3/10"
          chip="bg-c3"
        />

        {/* D — amber tint: REST + MCP */}
        <IconTile
          delay={0.1}
          icon={Terminal}
          title="REST API + MCP"
          body="Read endpoints and captured requests over a token-scoped REST API — or connect an AI agent via MCP."
          surface="bg-warn/10"
          chip="bg-warn"
        />

        {/* E — teal tint: playground */}
        <IconTile
          delay={0.15}
          icon={FlaskConical}
          title="Replay & test"
          body="Fire sample payloads, tweak headers, and replay captured requests — no external tools."
          surface="bg-c2/10"
          chip="bg-c2"
        />

        {/* F — wide gradient: forward to localhost */}
        <Reveal className="md:col-span-3" delay={0.05}>
          <div className="flex h-full flex-col items-start justify-between gap-6 rounded-xl bg-gradient-to-r from-primary via-c4 to-c2 p-6 text-white md:flex-row md:items-center">
            <div className="max-w-md">
              <h3 className="text-lg font-semibold">Forward straight to localhost</h3>
              <p className="mt-1.5 text-sm opacity-90">
                Securely bridge incoming webhooks to your dev machine or any URL,
                with custom methods and transforms. Stop deploying just to test.
              </p>
            </div>
            {/* TODO(landing): this webhook → localhost:3000 diagram is
                misleading — it flattens the catch+forward flow into a single
                hop. Rework into an accurate "source → catcher → localhost"
                visual (or drop it). Placeholder kept for now. */}
            <div className="flex items-center gap-3 font-mono text-sm">
              <span className="flex items-center gap-2 rounded-lg bg-white/20 px-3 py-2">
                <Cloud className="size-4" /> webhook
              </span>
              <ArrowRight className="size-4 opacity-80" />
              <span className="flex items-center gap-2 rounded-lg bg-white/20 px-3 py-2">
                <Laptop className="size-4" /> localhost:3000
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function IconTile({
  icon: Icon,
  title,
  body,
  surface,
  chip,
  delay,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  body: string;
  surface: string;
  chip: string;
  delay?: number;
}) {
  return (
    <Reveal className="md:col-span-1" delay={delay}>
      <div
        className={`flex h-full flex-col rounded-xl border border-border p-6 transition-shadow hover:shadow-md ${surface}`}
      >
        <span
          className={`flex size-10 items-center justify-center rounded-lg text-white ${chip}`}
        >
          <Icon className="size-5" strokeWidth={1.8} />
        </span>
        <h3 className="mt-4 font-semibold">{title}</h3>
        <p className="mt-1.5 text-sm text-mid">{body}</p>
      </div>
    </Reveal>
  );
}
