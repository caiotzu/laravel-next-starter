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

export function onlyDigits(value: string) {
  return value.replace(/\D/g, "")
}

export function maskCEP(value: string) {
  const cleaned = onlyDigits(value).slice(0, 8)

  const part1 = cleaned.slice(0, 5)
  const part2 = cleaned.slice(5, 8)

  let result = part1

  if (part2) result += `-${part2}`

  return result
}

export function maskPhone(value: string) {
  const cleaned = onlyDigits(value).slice(0, 11)

  if (cleaned.length <= 10) {
    const ddd = cleaned.slice(0, 2)
    const part1 = cleaned.slice(2, 6)
    const part2 = cleaned.slice(6, 10)

    let result = ddd ? `(${ddd}` : ""
    if (ddd.length === 2) result += ") "
    if (part1) result += part1
    if (part2) result += `-${part2}`

    return result
  }

  const ddd = cleaned.slice(0, 2)
  const part1 = cleaned.slice(2, 7)
  const part2 = cleaned.slice(7, 11)

  let result = ddd ? `(${ddd}` : ""
  if (ddd.length === 2) result += ") "
  if (part1) result += part1
  if (part2) result += `-${part2}`

  return result
}
