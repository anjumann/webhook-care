"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

/**
 * Emerald Console shell — full-height sidebar + topbar + content frame.
 * Replaces the centered top-header dashboard layout.
 * Reference: Screens.jsx `Shell()` / theme.css `.whc .side .main .content`.
 *
 * Pass `contentClassName="flex flex-col"` for full-height master–detail
 * screens (the request inspector).
 */
export function Shell({
  children,
  contentClassName,
}: {
  children: React.ReactNode;
  contentClassName?: string;
}) {
  const params = useParams();
  const userId = params?.userId as string | undefined;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <Sidebar userId={userId} />
      <main className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <div
          className={cn(
            "console-content flex-1 overflow-y-auto px-8 pb-8 pt-[26px]",
            contentClassName
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
}

export default Shell;
