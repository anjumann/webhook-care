import * as React from "react";

/**
 * Tiny dependency-free sparkline. Renders a normalized polyline over `pts`.
 * Ported from the Emerald Console reference (`Icons.jsx` Spark).
 */
export function Sparkline({
  pts,
  w = 58,
  h = 22,
  color = "var(--primary)",
  strokeWidth = 1.6,
  className,
}: {
  pts: number[];
  w?: number;
  h?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}) {
  if (!pts || pts.length < 2) return null;

  const max = Math.max(...pts);
  const min = Math.min(...pts);
  const rng = max - min || 1;
  const step = w / (pts.length - 1);
  const d = pts
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)} ${(
          h -
          2 -
          ((p - min) / rng) * (h - 4)
        ).toFixed(1)}`
    )
    .join(" ");

  return (
    <svg width={w} height={h} fill="none" className={className} aria-hidden="true">
      <path
        d={d}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
    </svg>
  );
}

export default Sparkline;
