import { cn } from "@/lib/utils";

/**
 * Page-header environment pill with a live pulse dot.
 * Reference: theme.css `.env` + `.pulse`.
 */
export function EnvPill({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-[7px] whitespace-nowrap rounded-full border border-border bg-card px-2.5 text-xs font-semibold text-mid",
        className
      )}
    >
      <span className="live-pulse" />
      {label}
    </span>
  );
}

export default EnvPill;
