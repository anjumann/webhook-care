"use client";

import * as React from "react";
import { Search, Bell } from "lucide-react";
import { useParams } from "next/navigation";
import { ModeToggle } from "@/components/theme-toggle";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { ConsoleBreadcrumb } from "./console-breadcrumb";
import { CommandPalette } from "./command-palette";

/**
 * Console topbar — breadcrumb, ⌘K search trigger, theme toggle, notifications.
 * Reference: theme.css `.topbar`.
 */
export function Topbar() {
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const params = useParams();
  const userId = params?.userId as string | undefined;

  return (
    <header className="flex h-14 flex-none items-center gap-3.5 border-b border-border px-6">
      <ConsoleBreadcrumb />
      <div className="flex-1" />

      <button
        onClick={() => setPaletteOpen(true)}
        className="flex h-8 min-w-[240px] items-center gap-2 rounded-sm border border-border bg-elev px-[11px] text-[13px] text-dim transition-colors hover:text-mid"
      >
        <Search className="size-3.5" strokeWidth={1.7} />
        <span>Search endpoints…</span>
        <kbd className="ml-auto rounded border border-border px-1.5 font-mono text-[10px] leading-5">
          ⌘K
        </kbd>
      </button>

      <InstallPrompt />

      <ModeToggle />

      <Popover>
        <PopoverTrigger asChild>
          <button
            aria-label="Notifications"
            className="flex size-8 items-center justify-center rounded-sm border border-border bg-elev text-mid transition-colors hover:text-foreground"
          >
            <Bell className="size-[15px]" strokeWidth={1.7} />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64">
          <div className="text-sm font-semibold">Notifications</div>
          <p className="mt-1 text-[13px] text-dim">
            You&rsquo;re all caught up — no notifications yet.
          </p>
        </PopoverContent>
      </Popover>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        userId={userId}
      />
    </header>
  );
}

export default Topbar;
