import { cn } from "@/lib/utils";

/**
 * HTTP method pill — mono accent. Reference: emerald.css `.meth-pill`.
 */
export function MethodPill({
  method,
  className,
}: {
  method: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md bg-accent-soft px-2 py-[3px] font-mono text-[11px] font-bold tracking-[0.02em] text-primary",
        className
      )}
    >
      {method.toUpperCase()}
    </span>
  );
}

export default MethodPill;
