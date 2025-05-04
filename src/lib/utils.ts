import { clsx, type ClassValue } from "clsx"
import toast from "react-hot-toast"
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

export async function copyToClipboard(text: string) {
  try {
    toast.success("Copied to clipboard")
    return await navigator.clipboard.writeText(text)
  } catch (error) {
    console.error("Failed to copy to clipboard:", error)
    toast.error("Failed to copy to clipboard")
  }
}
