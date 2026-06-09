"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Activity, Plus, Settings, SunMoon } from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { useEndpoints } from "@/endpoints/api/endpoints";

/**
 * ⌘K command palette — the first real home for the cmdk `command` primitive.
 * Lists quick actions + the user's endpoints. Toggled by ⌘K / Ctrl+K or the
 * topbar search button.
 */
export function CommandPalette({
  open,
  onOpenChange,
  userId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
}) {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const { endpoints } = useEndpoints(userId ?? "");
  const base = userId ? `/dashboard/${userId}` : "/dashboard";

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search endpoints or run a command…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => go(`${base}/endpoint/create`)}>
            <Plus className="size-4" />
            Create endpoint
          </CommandItem>
          <CommandItem onSelect={() => go(base)}>
            <Activity className="size-4" />
            Endpoints
          </CommandItem>
          <CommandItem onSelect={() => go(`${base}/setting/profile`)}>
            <Settings className="size-4" />
            Settings
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onOpenChange(false);
              setTheme(resolvedTheme === "dark" ? "light" : "dark");
            }}
          >
            <SunMoon className="size-4" />
            Toggle theme
          </CommandItem>
        </CommandGroup>
        {endpoints && endpoints.length > 0 && (
          <CommandGroup heading="Endpoints">
            {endpoints.map((endpoint) => (
              <CommandItem
                key={endpoint.id}
                value={endpoint.name}
                onSelect={() => go(`${base}/${endpoint.id}`)}
              >
                <Activity className="size-4" />
                {endpoint.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

export default CommandPalette;
