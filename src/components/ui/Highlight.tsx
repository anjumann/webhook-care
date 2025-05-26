import * as React from "react";
import { cn } from "@/lib/utils";

export type HighlightProps = React.HTMLAttributes<HTMLSpanElement> & {
  color?: string; // background or underline color
  textColor?: string; // text color
  variant?: "marker" | "underline";
};

export const Highlight = React.forwardRef<HTMLSpanElement, HighlightProps>(
  (
    { className, color = "#22c55e", variant = "marker", style, ...props },
    ref
  ) => {
    const baseStyle =
      variant === "marker"
        ? {
          background: `linear-gradient(120deg, ${color}33 60%, transparent 100%)`,
          borderRadius: "0.25em",
          padding: "0.1em 0.2em",
          transition: "background 0.2s",
        }
        : {
          borderBottom: `2px solid ${color}`,
          transition: "border-color 0.2s",
        };
    return (
      <span
        ref={ref}
        className={cn(
          "font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 text-slate-900/90 dark:text-white/80 ",
          className
        )}
        style={{ ...baseStyle, ...style }}
        {...props}
      />
    );
  }
);

Highlight.displayName = "Highlight";