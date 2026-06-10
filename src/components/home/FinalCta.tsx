import GetStartedBtn from "@/home/get-started-btn";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Reveal } from "./Reveal";

/** Closing call-to-action band. */
export function FinalCta() {
  return (
    <section className="container mx-auto max-w-6xl px-4 py-16 lg:py-24">
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-16 text-center text-accentfg">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              background:
                "radial-gradient(50% 80% at 50% 0%, rgba(255,255,255,.25), transparent 70%)",
            }}
          />
          <h2 className="relative text-3xl font-bold tracking-tight md:text-4xl">
            Start catching webhooks for free
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-lg opacity-90">
            No sign-up, no credit card. Spin up an endpoint and inspect your
            first request in seconds.
          </p>
          <div className="relative mt-8 flex justify-center">
            <GetStartedBtn>
              <Button size="lg" variant="secondary" className="group">
                Catch Webhooks
                <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </GetStartedBtn>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
