import { cn } from "@/lib/utils";
import { statusTone } from "@/lib/status";

/**
 * HTTP status-code pill, colored by `statusTone`.
 * Reference: emerald.css `.code-pill` / `StatusPill`.
 */
export function StatusPill({
  code,
  lg,
  className,
}: {
  code: number;
  lg?: boolean;
  className?: string;
}) {
  const tone = statusTone(code);
  const toneClass =
    tone === "ok"
      ? "bg-ok-soft text-ok"
      : tone === "warn"
        ? "bg-warn/15 text-warn"
        : tone === "danger"
          ? "bg-danger-soft text-danger"
          : "bg-elev2 text-dim";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md font-mono font-bold tabular-nums",
        lg ? "px-2.5 py-[3px] text-[11.5px]" : "px-2 py-0.5 text-[11px]",
        toneClass,
        className
      )}
    >
      {code}
    </span>
  );
}

export default StatusPill;
