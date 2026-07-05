/**
 * HTTP status-code → semantic tone, mirroring the Emerald Console reference
 * (`codeTone` / `StatusPill`). See docs/archive/UI-redesign/00-design-language.md §8.
 *
 *   < 300  → ok       (2xx success)
 *   < 400  → neutral  (3xx redirects)
 *   < 500  → warn     (4xx client errors)
 *   >= 500 → danger   (5xx server errors)
 */
export type StatusTone = "ok" | "neutral" | "warn" | "danger";

export function statusTone(code: number): StatusTone {
  if (code < 300) return "ok";
  if (code < 400) return "neutral";
  if (code < 500) return "warn";
  return "danger";
}

/** Tailwind text/bg/border color tokens for each tone (emerald ramp). */
export const STATUS_TONE_CLASSES: Record<
  StatusTone,
  { text: string; soft: string }
> = {
  ok: { text: "text-ok", soft: "bg-ok-soft text-ok" },
  neutral: { text: "text-dim", soft: "bg-elev2 text-dim" },
  warn: { text: "text-warn", soft: "bg-warn/15 text-warn" },
  danger: { text: "text-danger", soft: "bg-danger-soft text-danger" },
};
