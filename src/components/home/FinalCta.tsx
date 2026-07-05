import GetStartedBtn from "@/home/get-started-btn";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Reveal } from "./Reveal";

/** Closing call-to-action — a glass band over a deep emerald glow. */
export function FinalCta() {
  return (
    <section className="container mx-auto max-w-6xl px-4 py-16 lg:py-24">
      <Reveal>
        <div className="glass relative overflow-hidden rounded-3xl px-6 py-16 text-center">
          {/* emerald bloom inside the band */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(60% 90% at 50% 110%, var(--accent-soft), transparent 70%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, var(--accent-line), transparent)",
            }}
          />

          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Your next webhook is already on its way.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-lg text-mid">
            Mint an endpoint before it lands — free forever, no account, thirty
            days of history.
          </p>
          <div className="mt-8 flex justify-center">
            <GetStartedBtn cta="final">
              <Button size="lg" className="group">
                Catch it live
                <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </GetStartedBtn>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
