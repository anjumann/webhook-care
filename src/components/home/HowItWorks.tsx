import { Copy, Send, SearchCode } from "lucide-react";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

/**
 * How it works — three numbered glass cards (simplelist-style), each with a
 * tiny visual instead of an abstract icon row.
 */

const STEPS = [
  {
    icon: Copy,
    title: "Mint your URL",
    body: "One click in the dashboard — no account, no config. The endpoint is live before the page finishes loading.",
    visual: (
      <div className="glass-inset flex items-center justify-between rounded-lg px-3 py-2.5 font-mono text-[11.5px]">
        <span className="truncate text-primary">https://webhook.projext.in/…/orders</span>
        <Copy className="ml-2 size-3.5 flex-none text-dim" />
      </div>
    ),
  },
  {
    icon: Send,
    title: "Point anything at it",
    body: "Paste it into Stripe, GitHub, your cron job — or just curl it from the terminal to see the loop close.",
    visual: (
      <div className="glass-inset rounded-lg px-3 py-2.5 font-mono text-[11.5px] text-mid">
        <span className="text-dim">$ </span>curl -X POST{" "}
        <span className="text-primary">…/orders</span> -d{" "}
        <span className="text-accent2">&apos;{"{…}"}&apos;</span>
      </div>
    ),
  },
  {
    icon: SearchCode,
    title: "Inspect, replay, forward",
    body: "The request is already on screen. Read it, fire it again, or relay it to localhost and step through your handler.",
    visual: (
      <div className="glass-inset flex items-center gap-2.5 rounded-lg px-3 py-2.5 font-mono text-[11px]">
        <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold text-primary">
          POST
        </span>
        <span className="flex-1 truncate text-foreground/90">caught · just now</span>
        <span className="live-pulse" />
      </div>
    ),
  },
];

export function HowItWorks() {
  return (
    <section className="container mx-auto max-w-6xl px-4 py-20">
      <SectionHeading
        pill="How it works"
        title="Zero to caught in under a minute"
        sub="No SDK, no signup, no YAML. The slowest step is your provider’s settings page."
      />

      <div className="relative mt-12 grid gap-5 md:grid-cols-3">
        {/* connector line behind the number chips */}
        <div
          aria-hidden
          className="absolute left-[16%] right-[16%] top-7 hidden border-t border-dashed border-border2 md:block"
        />
        {STEPS.map((step, i) => (
          <Reveal key={step.title} delay={i * 0.08}>
            <div className="glass relative flex h-full flex-col rounded-2xl p-6 pt-10 text-center">
              <span className="glass-inset absolute -top-0 left-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl font-mono text-lg font-bold text-primary">
                {i + 1}
              </span>
              <h3 className="text-lg font-bold tracking-tight">{step.title}</h3>
              <p className="mt-2 flex-1 text-sm text-mid">{step.body}</p>
              <div className="mt-5 text-left">{step.visual}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
