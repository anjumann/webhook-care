import { cn } from "@/lib/utils";

/**
 * Active/Paused endpoint status badge. Reference: theme.css `.badge.ok` / `.badge.off`.
 */
export function StatusBadge({
  active,
  className,
}: {
  active: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-[3px] text-[11.5px] font-semibold",
        active
          ? "bg-ok-soft text-ok"
          : "border border-border bg-elev2 text-dim",
        className
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", active ? "bg-ok" : "bg-dim")}
      />
      {active ? "Active" : "Paused"}
    </span>
  );
}

export default StatusBadge;
