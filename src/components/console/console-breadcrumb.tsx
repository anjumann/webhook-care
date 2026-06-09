"use client";

import Link from "next/link";
import { Fragment } from "react";
import { usePathname, useParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { APP_NAME } from "@/constant/app-constant";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

type Crumb = { label: string; href?: string };

/**
 * Topbar breadcrumb, derived from the pathname. Reference: theme.css `.crumb`
 * (dim trail, bold leaf, chevron separators).
 */
export function ConsoleBreadcrumb() {
  const pathname = usePathname();
  const params = useParams();
  const userId = params?.userId as string | undefined;
  const base = userId ? `/dashboard/${userId}` : "/dashboard";

  const rest = pathname.replace(base, "").split("/").filter(Boolean);
  const crumbs: Crumb[] = [{ label: APP_NAME, href: base }];

  if (rest.length === 0) {
    crumbs.push({ label: "Endpoints" });
  } else if (rest[0] === "setting") {
    crumbs.push({ label: "Settings" });
    if (rest[1]) crumbs.push({ label: cap(rest[1]) });
  } else if (rest[0] === "endpoint" && rest[1] === "create") {
    crumbs.push({ label: "Endpoints", href: base }, { label: "New" });
  } else {
    crumbs.push({ label: "Endpoints", href: base });
    crumbs.push({ label: rest[1] === "edit" ? "Edit endpoint" : "Endpoint" });
  }

  return (
    <div className="flex items-center gap-2 text-[13px] text-dim">
      {crumbs.map((crumb, i) => {
        const isLeaf = i === crumbs.length - 1;
        return (
          <Fragment key={`${crumb.label}-${i}`}>
            {i > 0 && <ChevronRight className="size-3.5 opacity-50" />}
            {crumb.href && !isLeaf ? (
              <Link href={crumb.href} className="transition-colors hover:text-foreground">
                {crumb.label}
              </Link>
            ) : (
              <span className={isLeaf ? "font-semibold text-foreground" : undefined}>
                {crumb.label}
              </span>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

export default ConsoleBreadcrumb;
