import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date?: string | null): string {
  if (!date) return "---";

  const d = new Date(date);

  if (isNaN(d.getTime())) return "---";

  return `${d.toLocaleDateString("pt-BR")} • ${d.toLocaleTimeString(
    "pt-BR",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  )}`;
}