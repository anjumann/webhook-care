import { cn } from "@/lib/utils";
import { TONE_TILE, toneFromString } from "./tones";

/**
 * Deterministic endpoint/service logo — 2-letter initials on a `c1..c4` hue
 * derived from the name. Reference: emerald-screens.jsx `.svc-logo` / `SVC`.
 */
export function ServiceLogo({
  name,
  size = 34,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const tone = toneFromString(name);
  const parts = name.split(/[-_\s]+/).filter(Boolean);
  const a = parts[0]?.[0] ?? name[0] ?? "?";
  const b = parts[1]?.[0] ?? parts[0]?.[1] ?? "";
  const initials = (a + b).toUpperCase();

  return (
    <span
      className={cn(
        "inline-flex flex-none items-center justify-center rounded-[9px] font-bold leading-none",
        TONE_TILE[tone],
        className
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

export default ServiceLogo;
