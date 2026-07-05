"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Inbox } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { Reveal } from "./Reveal";
import {
  buildSampleRequest,
  type PlaygroundKind,
  type PlaygroundRequest,
} from "./playground";
import { track } from "@/lib/analytics";

/**
 * Simulated playground — visitors fire sample webhooks and watch them land in
 * a glass console, exactly as the real product renders them. Client-only by
 * design (no demo backend); the fixture logic lives in `playground.ts`.
 */

const SENDERS: { kind: PlaygroundKind; label: string }[] = [
  { kind: "stripe", label: "Stripe · payment succeeded" },
  { kind: "github", label: "GitHub · push" },
  { kind: "shopify", label: "Shopify · order created" },
  { kind: "custom", label: "curl · your own JSON" },
];

const MAX_ROWS = 5;

export function DemoPlayground() {
  const [caught, setCaught] = React.useState<PlaygroundRequest[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const seq = React.useRef(1);

  const send = (kind: PlaygroundKind) => {
    const req = buildSampleRequest(kind, seq.current);
    seq.current += 1;
    setCaught((prev) => [req, ...prev].slice(0, MAX_ROWS));
    setSelectedId(req.id);
    track("playground_sample_fired", { provider: kind });
  };

  const selected =
    caught.find((req) => req.id === selectedId) ?? caught[0] ?? null;

  return (
    <section id="playground" className="container mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
      <SectionHeading
        pill="Try it"
        title="Poke it. Right here."
        sub="Fire a sample webhook and watch it get caught. This console is a simulation — your real endpoint behaves exactly like this, with your traffic."
      />

      <Reveal className="mt-12">
        <div className="glass grid gap-0 overflow-hidden rounded-2xl md:grid-cols-[18rem_1fr]">
          {/* senders */}
          <div className="flex flex-col gap-2 border-b border-border p-5 md:border-b-0 md:border-r">
            <span className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-dim">
              Send a webhook
            </span>
            {SENDERS.map((sender) => (
              <button
                key={sender.kind}
                type="button"
                onClick={() => send(sender.kind)}
                className="glass-inset rounded-xl px-3.5 py-2.5 text-left text-sm font-medium text-mid transition-colors hover:border-accent-line hover:text-foreground active:scale-[.99]"
              >
                {sender.label}
              </button>
            ))}
            <p className="mt-auto pt-3 text-xs text-dim">
              Signature headers arrive redacted — secrets never get stored, even
              here.
            </p>
          </div>

          {/* console */}
          <div className="flex min-h-[22rem] flex-col">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <span className="font-mono text-[12px] text-mid">
                webhook.projext.in<span className="text-primary">/…/you</span>
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[11px] text-dim">
                <span className="live-pulse" />
                listening
              </span>
            </div>

            {caught.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-sm text-dim">
                <Inbox className="size-6 text-faint" />
                Nothing caught yet — fire one from the left.
              </div>
            ) : (
              <div className="grid flex-1 sm:grid-cols-[1.1fr_1fr]">
                <ul className="border-border p-2 sm:border-r">
                  <AnimatePresence initial={false}>
                    {caught.map((req) => (
                      <motion.li
                        key={req.id}
                        layout
                        initial={{ opacity: 0, y: -14, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedId(req.id)}
                          className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left ${
                            selected?.id === req.id
                              ? "glass-inset"
                              : "hover:bg-accent-soft/40"
                          }`}
                        >
                          <span className="rounded bg-accent-soft px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-primary">
                            {req.method}
                          </span>
                          <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-foreground/90">
                            {req.event}
                          </span>
                          <span className="hidden text-[11px] text-dim md:block">
                            {req.source}
                          </span>
                        </button>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>

                {selected && (
                  <div className="flex flex-col p-3">
                    <span className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-dim">
                      Payload
                    </span>
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={selected.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="glass-inset flex-1 overflow-auto rounded-lg p-3 scroll-thin"
                      >
                        <pre className="font-mono text-[11.5px] leading-relaxed text-mid">
                          {selected.body}
                        </pre>
                        <div className="mt-3 border-t border-border pt-2 font-mono text-[10.5px] leading-loose text-dim">
                          {selected.headers.map(([name, value]) => (
                            <div key={name} className="truncate">
                              {name}:{" "}
                              <span
                                className={
                                  value.includes("redacted")
                                    ? "rounded bg-accent-soft px-1 py-0.5 text-[9.5px] font-semibold text-primary"
                                    : "text-mid"
                                }
                              >
                                {value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
