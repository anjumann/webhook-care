import * as React from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Meta chip — icon + label + optional bold/mono value.
 * Reference: emerald.css `.chip`.
 */
export function Chip({
  icon: Icon,
  label,
  value,
  mono,
  className,
}: {
  icon?: LucideIcon;
  label?: React.ReactNode;
  value?: React.ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[30px] items-center gap-[7px] whitespace-nowrap rounded-[9px] border border-border bg-inset px-[11px] text-xs text-mid",
        className
      )}
    >
      {Icon && <Icon className="size-[13px] text-dim" strokeWidth={1.7} />}
      {label}
      {value != null && (
        <span
          className={cn(
            "font-semibold text-foreground",
            mono && "font-mono text-[11.5px]"
          )}
        >
          {value}
        </span>
      )}
    </span>
  );
}

export default Chip;
