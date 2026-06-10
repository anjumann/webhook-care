import { clsx, type ClassValue } from "clsx"
import { toast } from "@/lib/toast";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).format(date)
}

/**
 * Compact relative time ("just now", "5m ago", "3h ago", "2d ago"). Falls back
 * to the absolute `formatDate` for anything older than ~30 days, and to "—" for
 * invalid/missing dates. Used in lists where an at-a-glance recency beats a
 * precise timestamp.
 */
export function formatRelative(date: Date) {
  const ms = date.getTime();
  if (Number.isNaN(ms)) return "—";
  const diff = Date.now() - ms;
  if (diff < 0) return "just now";
  const sec = Math.round(diff / 1000);
  if (sec < 45) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  return formatDate(date);
}

/** True when `date` is within the last `withinMs` (default 5 min) — "live now". */
export function isRecent(date: Date, withinMs = 5 * 60 * 1000) {
  const ms = date.getTime();
  if (Number.isNaN(ms)) return false;
  const diff = Date.now() - ms;
  return diff >= 0 && diff <= withinMs;
}

export async function copyToClipboard(text: string) {
  try {
    toast.success("Copied to clipboard")
    return await navigator.clipboard.writeText(text)
  } catch (error) {
    console.error("Failed to copy to clipboard:", error)
    toast.error("Failed to copy to clipboard")
  }
}
