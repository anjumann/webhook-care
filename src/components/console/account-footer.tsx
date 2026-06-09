"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, User, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useUser } from "@/hooks/useUser";
import { getProfile } from "@/profile/api";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Sidebar account footer — avatar + identity + dropdown (profile, theme).
 * Reference: theme.css `.acct`. Email surfaces once magic-link identity lands;
 * until then we show the truncated workspace id.
 */
export function AccountFooter({ userId }: { userId?: string }) {
  const user = useUser();
  const id = userId ?? user.id;
  const { setTheme } = useTheme();
  const [profile, setProfile] = React.useState<{
    userName?: string;
    userImage?: string;
  } | null>(null);

  React.useEffect(() => {
    if (!id) return;
    getProfile(id)
      .then(setProfile)
      .catch(() => {});
  }, [id]);

  const name = profile?.userName ? cap(profile.userName) : "Local workspace";
  const initial = (profile?.userName?.[0] ?? "W").toUpperCase();
  const img = profile?.userImage ? `/avatar/${profile.userImage}` : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center gap-2.5 rounded-sm border border-border p-2 text-left transition-colors hover:bg-elev">
          {img ? (
            <Image
              src={img}
              alt=""
              width={28}
              height={28}
              className="size-7 flex-none rounded-full object-cover"
            />
          ) : (
            <span className="flex size-7 flex-none items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent2 text-[12px] font-bold text-accentfg">
              {initial}
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate text-[12.5px] font-semibold">
              {name}
            </span>
            <span className="block truncate font-mono text-[11px] text-dim">
              {id ? `${id.slice(0, 14)}…` : "—"}
            </span>
          </span>
          <ChevronDown className="ml-auto size-4 flex-none text-dim" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-[200px]">
        <DropdownMenuLabel className="truncate">{name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={id ? `/dashboard/${id}/setting/profile` : "#"}>
            <User className="size-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="size-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="size-4" />
          Dark
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default AccountFooter;
