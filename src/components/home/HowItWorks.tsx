import { Zap, Send, Eye } from "lucide-react";
import { Reveal } from "./Reveal";
import { StepConnector } from "./StepConnector";

const steps = [
  {
    icon: Zap,
    title: "Create your endpoint",
    body: "Instantly generate a unique webhook URL — no account, no config.",
    snippet: (
      <>
        <span className="text-dim">›</span> https://wcat.dev/
        <span className="text-primary">abc123</span>
      </>
    ),
  },
  {
    icon: Send,
    title: "Send a webhook",
    body: "Point your service at the URL, or fire a test with the ready-made cURL.",
    snippet: (
      <>
        <span className="text-dim">$</span> curl -X{" "}
        <span className="text-accent2">POST</span> …/abc123
      </>
    ),
  },
  {
    icon: Eye,
    title: "Inspect & forward",
    body: "Read the full request, replay it, and forward it to your localhost.",
    snippet: (
      <>
        <span className="rounded bg-accent-soft px-1 font-semibold text-primary">
          POST
        </span>{" "}
        /abc123 <span className="text-ok">200</span>
      </>
    ),
  },
];

/**
 * "How it works" — a connected 3-step pipeline. Numbered emerald nodes joined
 * by an animated connector, each step grounded by a mono snippet so the columns
 * carry weight at full screen width instead of floating in empty space.
 */
export function HowItWorks() {
  return (
    <section className="border-y border-border bg-elev/40">
      <div className="container mx-auto px-4 py-16 lg:py-24">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
              how it works
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              Start catching in 3 steps
            </h2>
            <p className="mt-3 text-lg text-mid">
              From zero to your first captured request in under a minute.
            </p>
          </div>
        </Reveal>

        <div className="relative mx-auto mt-16 max-w-5xl">
          <StepConnector />
          <ol className="grid gap-12 md:grid-cols-3 md:gap-8">
            {steps.map((step, i) => (
              <Reveal key={step.title} delay={0.15 + i * 0.12}>
                <li className="flex flex-col items-center text-center md:items-start md:text-left">
                  {/* node */}
                  <span className="relative z-10 rounded-full bg-background p-1.5">
                    <span className="flex size-11 items-center justify-center rounded-full bg-primary text-accentfg shadow-[0_6px_20px_var(--accent-soft)]">
                      <step.icon className="size-5" strokeWidth={2} />
                    </span>
                  </span>

                  <div className="mt-5 flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-primary">
                      0{i + 1}
                    </span>
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                  </div>
                  <p className="mt-2 max-w-xs text-mid md:max-w-none">{step.body}</p>

                  <code className="mt-4 inline-flex max-w-full items-center overflow-x-auto whitespace-nowrap rounded-lg border border-border bg-inset px-3 py-2 font-mono text-[12.5px] text-mid">
                    {step.snippet}
                  </code>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
