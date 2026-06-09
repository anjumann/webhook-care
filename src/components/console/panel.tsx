import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Console panel — card surface with optional header row.
 * Reference: theme.css `.panel` / `.panel-head` (`.t` title · `.c` count · `.right`).
 */
export function Panel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-card shadow-[var(--card-shadow)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function PanelHead({
  title,
  count,
  right,
  className,
}: {
  title: React.ReactNode;
  count?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 border-b border-border px-[18px] py-[15px]",
        className
      )}
    >
      <span className="text-sm font-semibold">{title}</span>
      {count != null && (
        <span className="rounded-full border border-border px-[7px] py-px font-mono text-[11px] text-dim tabular-nums">
          {count}
        </span>
      )}
      {right && <div className="ml-auto flex items-center gap-2">{right}</div>}
    </div>
  );
}

export default Panel;
