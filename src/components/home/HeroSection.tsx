import Link from "next/link";
import GetStartedBtn from "@/home/get-started-btn";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import { Reveal } from "./Reveal";
import { HeroConsole } from "./HeroConsole";

/**
 * Landing hero — centered headline over the animated webhook-flow console.
 * Atmosphere: faint dot grid + a single emerald glow; everything else is glass.
 */
export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* dot-grid texture, faded toward the bottom */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, var(--border2) 1px, transparent 0)",
          backgroundSize: "28px 28px",
          maskImage:
            "radial-gradient(110% 80% at 50% 0%, #000 30%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(110% 80% at 50% 0%, #000 30%, transparent 75%)",
        }}
      />
      {/* emerald glow behind the headline */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(50% 45% at 50% 0%, var(--accent-soft), transparent 70%)",
        }}
      />

      <div className="container mx-auto max-w-5xl px-4 pb-20 pt-16 lg:pt-24">
        <Reveal className="flex flex-col items-center text-center">
          <a
            href="https://www.producthunt.com/products/webhook-catcher"
            target="_blank"
            rel="noopener noreferrer"
            className="section-pill normal-case tracking-normal transition-colors hover:text-foreground"
          >
            <span className="text-primary">▲ 103</span> on Product Hunt · free
            forever · no sign-up
          </a>

          <h1 className="mt-6 max-w-3xl text-[2.6rem] font-bold leading-[1.05] tracking-tight md:text-[4rem]">
            Your webhooks have{" "}
            <span className="bg-gradient-to-r from-primary to-accent2 bg-clip-text text-transparent">
              nowhere to hide.
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-lg text-mid">
            Mint a URL in one click and point any service at it. Every request
            lands live — inspect the full payload, replay it, or forward it
            straight to localhost.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <GetStartedBtn>
              <Button size="lg" className="group">
                Mint your endpoint
                <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </GetStartedBtn>
            <Button size="lg" variant="outline" asChild>
              <Link href="#playground">Poke the demo</Link>
            </Button>
          </div>

          <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-dim">
            {["30-day history", "Replay & edit", "REST API + MCP"].map(
              (item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <Check className="size-4 text-primary" strokeWidth={2.4} />
                  {item}
                </li>
              )
            )}
          </ul>
        </Reveal>

        <Reveal delay={0.15} className="mt-12 lg:mt-14">
          <HeroConsole />
        </Reveal>
      </div>
    </section>
  );
}
