import * as React from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sparkline } from "@/components/charts/sparkline";
import { TONE_TILE, type ConsoleTone } from "./tones";

/**
 * KPI card. Reference: theme.css `.kpi` (+ `.kpi.feature`).
 * `spark` is optional — only pass a real series; never fabricate a trend.
 */
export function KpiCard({
  label,
  icon: Icon,
  value,
  delta,
  deltaTone = "flat",
  feature,
  tone = "c1",
  spark,
  className,
}: {
  label: string;
  icon: LucideIcon;
  value: React.ReactNode;
  delta?: React.ReactNode;
  deltaTone?: "up" | "flat";
  feature?: boolean;
  tone?: ConsoleTone;
  spark?: number[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-card p-4 shadow-[var(--card-shadow)]",
        feature
          ? "border border-accent-line bg-gradient-to-br from-accent-soft to-card"
          : "border border-border",
        className
      )}
    >
      <div className="flex items-center gap-2 whitespace-nowrap text-[12.5px] font-medium text-mid">
        <span
          className={cn(
            "flex size-6 flex-none items-center justify-center rounded-[7px]",
            TONE_TILE[tone]
          )}
        >
          <Icon className="size-[13px]" strokeWidth={1.7} />
        </span>
        {label}
      </div>
      <div className="mt-[11px] text-[29px] font-bold tracking-[-0.6px] tabular-nums">
        {value}
      </div>
      {delta && (
        <div
          className={cn(
            "mt-1.5 flex items-center gap-1 text-[11.5px] font-semibold tabular-nums",
            deltaTone === "up" ? "text-ok" : "text-dim"
          )}
        >
          {delta}
        </div>
      )}
      {spark && spark.length > 1 && (
        <div className="absolute bottom-3.5 right-3.5 opacity-85">
          <Sparkline pts={spark} color={`var(--${tone})`} />
        </div>
      )}
    </div>
  );
}

export default KpiCard;
