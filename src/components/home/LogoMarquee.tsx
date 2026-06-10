import { ServiceLogo } from "@/components/console/service-logo";
import { Reveal } from "./Reveal";

/**
 * "Works with anything" band — two counter-drifting rows of service tiles.
 * Pure CSS marquee (globals.css §landing); tiles reuse the console's
 * deterministic initials logo, so no third-party logo assets are shipped.
 */

const ROW_A = [
  "Stripe",
  "GitHub",
  "Shopify",
  "Slack",
  "Twilio",
  "PayPal",
  "Discord",
  "Linear",
];

const ROW_B = [
  "Vercel",
  "Notion",
  "OpenAI",
  "Clerk",
  "Resend",
  "Supabase",
  "SendGrid",
  "Square",
];

function MarqueeRow({ names, reverse }: { names: string[]; reverse?: boolean }) {
  // track is rendered twice so translateX(-50%) loops seamlessly
  const loop = [...names, ...names];
  return (
    <div className="marquee-mask overflow-hidden">
      <div className={`marquee-track gap-3 pr-3 ${reverse ? "reverse" : ""}`}>
        {loop.map((name, i) => (
          <span
            key={`${name}-${i}`}
            className="glass-inset flex items-center gap-2.5 rounded-xl px-4 py-2.5"
            aria-hidden={i >= names.length}
          >
            <ServiceLogo name={name} size={26} />
            <span className="whitespace-nowrap text-sm text-mid">{name}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function LogoMarquee() {
  return (
    <section className="container mx-auto max-w-6xl px-4 py-14">
      <Reveal>
        <p className="mb-7 text-center text-sm font-medium uppercase tracking-[0.18em] text-dim">
          If it can send a webhook, it lands here
        </p>
        <div className="space-y-3">
          <MarqueeRow names={ROW_A} />
          <MarqueeRow names={ROW_B} reverse />
        </div>
      </Reveal>
    </section>
  );
}
