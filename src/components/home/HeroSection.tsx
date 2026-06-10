import GetStartedBtn from "@/home/get-started-btn";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, ChevronRight } from "lucide-react";
import { Reveal } from "./Reveal";

/**
 * Landing hero — typographic headline + CTA on the left, a faux
 * "curl → captured request" visual on the right. Atmosphere comes from a
 * faded dot-grid texture + emerald glow so the dark canvas reads intentional.
 */
export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* dot-grid texture, faded toward the bottom */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20 opacity-[0.5] dark:opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, var(--border2) 1px, transparent 0)",
          backgroundSize: "28px 28px",
          maskImage:
            "radial-gradient(120% 90% at 50% 0%, #000 35%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(120% 90% at 50% 0%, #000 35%, transparent 80%)",
        }}
      />
      {/* accent glow behind the headline */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(55% 50% at 12% 5%, var(--accent-soft), transparent 70%)",
        }}
      />

      <div className="container mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-2 lg:py-24">
        <Reveal>
          <div className="flex flex-col items-start">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-elev/70 px-3 py-1 text-xs font-medium text-mid backdrop-blur">
              <span className="live-pulse" />
              Free forever · No sign-up · 30-day history
            </span>

            <h1 className="mt-6 text-[2.7rem] font-bold leading-[1.03] tracking-tight md:text-6xl">
              Webhooks,
              <br />
              caught in{" "}
              <span className="bg-gradient-to-r from-primary to-accent2 bg-clip-text text-transparent">
                seconds.
              </span>
            </h1>

            <p className="mt-5 max-w-md text-lg text-mid">
              Spin up a unique endpoint, inspect every request in real time,
              and forward it straight to your localhost — no setup, no signup.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <GetStartedBtn>
                <Button size="lg" className="group">
                  Catch Webhooks
                  <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </GetStartedBtn>
            </div>

            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-dim">
              {["No credit card", "Forward to localhost", "REST + MCP access"].map(
                (item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <Check className="size-4 text-primary" strokeWidth={2.4} />
                    {item}
                  </li>
                )
              )}
            </ul>
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <HeroVisual />
        </Reveal>
      </div>
    </section>
  );
}

/** Faux terminal → captured-request card. The payload sent and the payload
 *  caught match exactly (it's the same request, caught — not a response). */
function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:ml-auto lg:mr-0">
      {/* soft glow behind the cards */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] opacity-60 blur-2xl"
        style={{
          background:
            "radial-gradient(60% 60% at 60% 30%, var(--accent-soft), transparent 75%)",
        }}
      />

      {/* terminal — you send a webhook */}
      <div className="overflow-hidden rounded-xl border border-border bg-elev shadow-2xl ring-1 ring-black/5">
        <div className="flex items-center gap-1.5 border-b border-border bg-inset px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-faint" />
          <span className="size-2.5 rounded-full bg-faint" />
          <span className="size-2.5 rounded-full bg-faint" />
          <span className="ml-2 font-mono text-[11px] text-dim">your service</span>
        </div>
        <pre className="overflow-x-auto px-4 py-3.5 font-mono text-[12.5px] leading-relaxed text-mid">
          <span className="text-dim">$ </span>curl -X POST{" "}
          <span className="text-primary">https://wcat.dev/abc123</span> \{"\n"}
          {"    "}-d{" "}
          <span className="text-accent2">{`'{"event":"payment.succeeded","amount":4200}'`}</span>
        </pre>
      </div>

      {/* connector */}
      <div className="flex flex-col items-center py-1.5 text-[11px] font-medium text-faint">
        <ChevronRight className="size-5 rotate-90" />
        <span>caught instantly</span>
      </div>

      {/* captured request card — the same payload, caught */}
      <div className="overflow-hidden rounded-xl border border-border bg-elev shadow-2xl ring-1 ring-black/5">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="rounded bg-accent-soft px-1.5 py-0.5 font-mono text-[11px] font-semibold text-primary">
              POST
            </span>
            <span className="font-mono text-[12px] text-mid">/abc123</span>
          </div>
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-dim">
            <span className="live-pulse" />
            caught · just now
          </span>
        </div>
        <pre className="overflow-x-auto px-4 py-3.5 font-mono text-[12px] leading-relaxed text-mid">
          {`{
  "event": "payment.succeeded",
  "amount": 4200
}`}
        </pre>
      </div>
    </div>
  );
}
