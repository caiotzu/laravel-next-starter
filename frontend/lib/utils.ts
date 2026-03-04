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

export function maskCNPJ(value: string) {
  const cleaned = value
    .replace(/\D/g, "") // apenas números
    .slice(0, 14);

  const part1 = cleaned.slice(0, 2);
  const part2 = cleaned.slice(2, 5);
  const part3 = cleaned.slice(5, 8);
  const part4 = cleaned.slice(8, 12);
  const part5 = cleaned.slice(12, 14);

  let result = part1;

  if (part2) result += `.${part2}`;
  if (part3) result += `.${part3}`;
  if (part4) result += `/${part4}`;
  if (part5) result += `-${part5}`;

  return result;
}

export function maskCNPJAlfanumerico(value: string) {
  const cleaned = value
    .replace(/[^a-zA-Z0-9]/g, "") // permite letras e números
    .toUpperCase()
    .slice(0, 14);

  const part1 = cleaned.slice(0, 2);
  const part2 = cleaned.slice(2, 5);
  const part3 = cleaned.slice(5, 8);
  const part4 = cleaned.slice(8, 12);
  const part5 = cleaned.slice(12, 14);

  let result = part1;

  if (part2) result += `.${part2}`;
  if (part3) result += `.${part3}`;
  if (part4) result += `/${part4}`;
  if (part5) result += `-${part5}`;

  return result;
}