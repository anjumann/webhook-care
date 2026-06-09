import Link from "next/link";
import { Webhook } from "lucide-react";
import { APP_NAME, APP_VERSION } from "@/constant/app-constant";

/**
 * Sidebar brand lockup — gradient mark tile + wordmark + version chip.
 * Reference: theme.css `.brand`.
 */
export function Brand({ href }: { href: string }) {
  const [first, ...rest] = APP_NAME.split(" ");
  const major = APP_VERSION.split(".")[0];

  return (
    <Link
      href={href}
      className="flex items-center gap-[11px] px-2 pb-1 pt-1.5"
      aria-label={APP_NAME}
    >
      <span className="flex size-[30px] flex-none items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent2 text-accentfg shadow-[0_4px_14px_var(--accent-soft)]">
        <Webhook className="size-[17px]" strokeWidth={2.2} />
      </span>
      <span className="whitespace-nowrap text-[15px] font-bold tracking-[-0.2px]">
        {first}
        {rest.length > 0 && <span className="text-primary"> {rest.join(" ")}</span>}
      </span>
      <span className="ml-auto rounded-[5px] border border-border px-[5px] py-px font-mono text-[10px] text-dim">
        v{major}
      </span>
    </Link>
  );
}

export default Brand;
