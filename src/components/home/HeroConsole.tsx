"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Hero visual — an animated SVG "webhook flow" (pulses travelling from three
 * service nodes into the endpoint) feeding a floating glass console where
 * captured requests materialize on a loop. Pure presentation: the feed is a
 * fixture carousel, no network. SMIL drives the SVG pulses (zero JS per frame);
 * framer-motion drives the row entrances.
 */

type FeedItem = {
  source: string;
  event: string;
  path: string;
  body: string;
};

const FEED: FeedItem[] = [
  {
    source: "Stripe",
    event: "payment_intent.succeeded",
    path: "/u/ord-7f2",
    body: `{
  "type": "payment_intent.succeeded",
  "data": { "amount": 4200, "currency": "usd" }
}`,
  },
  {
    source: "GitHub",
    event: "push · main",
    path: "/u/ord-7f2",
    body: `{
  "ref": "refs/heads/main",
  "commits": [{ "message": "fix: retry queue" }]
}`,
  },
  {
    source: "Shopify",
    event: "orders/create",
    path: "/u/ord-7f2",
    body: `{
  "order_number": 1047,
  "total_price": "89.00"
}`,
  },
  {
    source: "Slack",
    event: "app_mention",
    path: "/u/ord-7f2",
    body: `{
  "event": { "type": "app_mention", "user": "U02" }
}`,
  },
  {
    source: "Twilio",
    event: "message.received",
    path: "/u/ord-7f2",
    body: `{
  "From": "+15550100",
  "Body": "STATUS"
}`,
  },
];

const ROW_INTERVAL_MS = 2600;
const VISIBLE_ROWS = 4;

const AGE_LABELS = ["just now", "3s ago", "6s ago", "9s ago"];

/** Animated flow graphic: three sources → one endpoint. */
function FlowGraphic() {
  const paths = [
    "M 120 64 C 120 116, 380 92, 380 142",
    "M 380 64 L 380 142",
    "M 640 64 C 640 116, 380 92, 380 142",
  ];
  const sources: { x: number; label: string; tone: string }[] = [
    { x: 120, label: "Stripe", tone: "var(--c2)" },
    { x: 380, label: "GitHub", tone: "var(--c3)" },
    { x: 640, label: "Shopify", tone: "var(--c4)" },
  ];

  return (
    <svg
      viewBox="0 0 760 148"
      className="mx-auto -mb-px hidden w-full max-w-3xl md:block"
      aria-hidden
    >
      {paths.map((d) => (
        <g key={d}>
          <path d={d} fill="none" stroke="var(--border2)" strokeWidth="1" />
          <path
            d={d}
            fill="none"
            stroke="var(--accent-line)"
            strokeWidth="1.5"
            className="dash-flow"
          />
        </g>
      ))}

      {paths.map((d, i) => (
        <g key={`pulse-${d}`}>
          <circle r="7" fill="var(--accent2)" opacity="0.25">
            <animateMotion
              dur="2.6s"
              begin={`${i * 0.85}s`}
              repeatCount="indefinite"
              path={d}
            />
          </circle>
          <circle r="3" fill="var(--accent2)">
            <animateMotion
              dur="2.6s"
              begin={`${i * 0.85}s`}
              repeatCount="indefinite"
              path={d}
            />
          </circle>
        </g>
      ))}

      {sources.map((s) => (
        <g key={s.label}>
          <rect
            x={s.x - 24}
            y={12}
            width="48"
            height="48"
            rx="13"
            fill="var(--inset)"
            stroke="var(--border2)"
          />
          <text
            x={s.x}
            y={42}
            textAnchor="middle"
            fontSize="15"
            fontWeight="700"
            fill={s.tone}
            fontFamily="var(--font-mono)"
          >
            {s.label.slice(0, 2).toUpperCase()}
          </text>
          <text
            x={s.x}
            y={74}
            textAnchor="middle"
            fontSize="10.5"
            fill="var(--dim)"
          >
            {s.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function HeroConsole() {
  const [rows, setRows] = React.useState<(FeedItem & { key: number })[]>(() =>
    FEED.slice(0, 3)
      .map((item, i) => ({ ...item, key: i }))
      .reverse()
  );
  const counter = React.useRef(3);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setRows((prev) => {
        const next = {
          ...FEED[counter.current % FEED.length],
          key: counter.current,
        };
        counter.current += 1;
        return [next, ...prev].slice(0, VISIBLE_ROWS);
      });
    }, ROW_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const latest = rows[0];

  return (
    <div className="relative mx-auto w-full max-w-3xl">
      {/* glow bed under the whole visual */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-10 -z-10 opacity-70 blur-3xl"
        style={{
          background:
            "radial-gradient(55% 60% at 50% 55%, var(--accent-soft), transparent 75%)",
        }}
      />

      <FlowGraphic />

      <div className="glass float-slow overflow-hidden rounded-2xl">
        {/* console topbar */}
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <span className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-faint/60" />
              <span className="size-2.5 rounded-full bg-faint/60" />
              <span className="size-2.5 rounded-full bg-faint/60" />
            </span>
            <span className="font-mono text-[12px] text-mid">
              webhook.projext.in<span className="text-primary">/…/orders</span>
            </span>
          </div>
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-dim">
            <span className="live-pulse" />
            listening
          </span>
        </div>

        <div className="grid md:grid-cols-[1.2fr_1fr]">
          {/* request feed */}
          <ul className="min-h-[13.5rem] border-border p-2 md:border-r">
            <AnimatePresence initial={false}>
              {rows.map((row, i) => (
                <motion.li
                  key={row.key}
                  layout
                  initial={{ opacity: 0, y: -16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.21, 0.47, 0.32, 0.98] }}
                  className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 ${
                    i === 0 ? "glass-inset" : ""
                  }`}
                >
                  <span className="rounded bg-accent-soft px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-primary">
                    POST
                  </span>
                  <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-foreground/90">
                    {row.event}
                  </span>
                  <span className="hidden text-[11px] text-dim sm:block">
                    {row.source}
                  </span>
                  <span className="font-mono text-[10.5px] text-faint tnum">
                    {AGE_LABELS[i]}
                  </span>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          {/* payload of the newest capture */}
          <div className="hidden flex-col p-3 md:flex">
            <span className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-dim">
              Payload
            </span>
            <AnimatePresence mode="wait" initial={false}>
              <motion.pre
                key={latest.key}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="glass-inset flex-1 overflow-hidden rounded-lg p-3 font-mono text-[11.5px] leading-relaxed text-mid"
              >
                {latest.body}
              </motion.pre>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
