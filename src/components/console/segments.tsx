"use client";

import { cn } from "@/lib/utils";

/**
 * Segmented control (All/Active/Paused, 1h/24h/7d…).
 * Reference: theme.css `.segs`.
 */
export function Segments<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex gap-0.5 rounded-sm border border-border bg-inset p-0.5",
        className
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-[calc(var(--radius-sm)-2px)] px-[11px] py-1 text-xs font-semibold transition-colors",
            value === option.value
              ? "bg-elev2 text-foreground shadow-[0_1px_2px_color-mix(in_srgb,var(--foreground)_14%,transparent)]"
              : "text-dim hover:text-mid"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default Segments;
