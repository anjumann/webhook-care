import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

/**
 * Social proof — real reviews from the Product Hunt launch
 * (producthunt.com/products/webhook-catcher). One lead quote, two supporting.
 */

const PRODUCT_HUNT_URL = "https://www.producthunt.com/products/webhook-catcher";

const LEAD_QUOTE = {
  quote:
    "Really impressed by this tool’s focus on simplifying webhook testing! Instantly creating disposable URLs and inspecting payloads makes debugging way less painful.",
  name: "Supa Liu",
  handle: "@supa_l",
};

const SUPPORT_QUOTES = [
  {
    quote:
      "This tool is a game-changer for developers! Instantly creating disposable webhook URLs, inspecting payloads, and customizing responses makes debugging so much faster.",
    name: "Joy Wang",
    handle: "@joy_171",
  },
  {
    quote:
      "It’s wonderful to see a tool born out of personal challenges, making it relatable and genuinely useful.",
    name: "Alex Cloudstar",
    handle: "@alexcloudstar",
  },
];

export function Testimonials() {
  return (
    <section className="container mx-auto max-w-5xl px-4 py-20">
      <SectionHeading pill="Developers" title="Debuggers love it" />

      <Reveal className="mt-12">
        <figure className="glass relative mx-auto max-w-3xl rounded-2xl px-7 py-10 text-center md:px-12">
          <span
            aria-hidden
            className="absolute left-6 top-4 font-serif text-6xl leading-none text-primary/40"
          >
            “
          </span>
          <blockquote className="text-xl font-medium leading-relaxed md:text-2xl">
            {LEAD_QUOTE.quote}
          </blockquote>
          <figcaption className="mt-6 text-sm text-mid">
            <span className="font-semibold text-foreground">
              {LEAD_QUOTE.name}
            </span>{" "}
            · {LEAD_QUOTE.handle} on Product Hunt
          </figcaption>
        </figure>
      </Reveal>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        {SUPPORT_QUOTES.map((item, i) => (
          <Reveal key={item.handle} delay={0.08 + i * 0.08}>
            <figure className="glass h-full rounded-2xl p-6">
              <blockquote className="text-sm leading-relaxed text-mid">
                “{item.quote}”
              </blockquote>
              <figcaption className="mt-4 text-xs text-dim">
                <span className="font-semibold text-foreground/90">
                  {item.name}
                </span>{" "}
                · {item.handle}
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.2} className="mt-8 text-center">
        <a
          href={PRODUCT_HUNT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="section-pill normal-case tracking-normal transition-colors hover:text-foreground"
        >
          <span className="text-primary">▲ 103 upvotes</span> — read the launch
          on Product Hunt
        </a>
      </Reveal>
    </section>
  );
}
