"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Settings, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEndpoints } from "@/endpoints/api/endpoints";

/**
 * Console sidebar nav. Only routes that exist today are shown (Endpoints,
 * Settings); Requests / Forwarding / Playground light up as those features
 * land (see docs/UI redesign/02-screen-redesigns.md §0). Active state is
 * derived from the pathname.
 */
export function SidebarNav({
  userId,
  only,
  className,
}: {
  userId?: string;
  only?: "workspace" | "account";
  className?: string;
}) {
  const pathname = usePathname();
  const { endpoints } = useEndpoints(only === "account" ? "" : userId ?? "");
  const base = userId ? `/dashboard/${userId}` : "/dashboard";

  const isSettings = pathname.includes("/setting");
  const isEndpoints = pathname.startsWith(base) && !isSettings;

  const allGroups: {
    key: "workspace" | "account";
    cap: string;
    items: {
      label: string;
      href: string;
      icon: LucideIcon;
      active: boolean;
      count?: number;
    }[];
  }[] = [
    {
      key: "workspace",
      cap: "Workspace",
      items: [
        {
          label: "Endpoints",
          href: base,
          icon: Activity,
          active: isEndpoints,
          count: endpoints?.length,
        },
      ],
    },
    {
      key: "account",
      cap: "Account",
      items: [
        {
          label: "Settings",
          href: `${base}/setting/profile`,
          icon: Settings,
          active: isSettings,
        },
      ],
    },
  ];

  const groups = only ? allGroups.filter((g) => g.key === only) : allGroups;

  return (
    <nav className={cn("flex flex-col gap-0.5", className)}>
      {groups.map((group) => (
        <div key={group.cap}>
          <div className="px-2.5 pb-1.5 pt-3.5 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-faint">
            {group.cap}
          </div>
          {group.items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-2.5 rounded-sm px-2.5 py-[7px] text-[13.5px] font-medium transition-colors",
                  item.active
                    ? "bg-accent-soft text-foreground"
                    : "text-mid hover:bg-elev hover:text-foreground"
                )}
              >
                <Icon
                  strokeWidth={1.7}
                  className={cn(
                    "size-4 flex-none",
                    item.active ? "text-primary opacity-100" : "opacity-80"
                  )}
                />
                <span>{item.label}</span>
                {typeof item.count === "number" && (
                  <span className="ml-auto font-mono text-[11px] text-dim tabular-nums">
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export default SidebarNav;
