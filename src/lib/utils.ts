import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { ulid } from "ulid"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateULID() {
  return ulid()
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

export function copyToClipboard(text: string) {
  return navigator.clipboard.writeText(text)
}
