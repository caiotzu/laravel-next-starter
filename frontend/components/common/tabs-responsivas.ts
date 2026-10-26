/**
 * Classes para abas (`Tabs`) que precisam caber em telas pequenas.
 *
 * Mobile: grade de colunas iguais, ícone em cima e rótulo embaixo (quebrando linha se preciso),
 * em vez de uma única linha `nowrap` que transborda. A partir de `sm`: layout horizontal de sempre.
 * Use `abasListaClasses(n)` com o número de abas e `ABA_GATILHO_CLASSES` em cada `TabsTrigger`.
 */
const COLUNAS: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};

export function abasListaClasses(quantidade: 2 | 3 | 4): string {
  return `grid h-auto w-full ${COLUNAS[quantidade]} sm:inline-flex sm:justify-start`;
}

export const ABA_GATILHO_CLASSES =
  "flex-col gap-1 whitespace-normal px-1 py-2 text-center text-xs sm:flex-row sm:gap-1.5 sm:whitespace-nowrap sm:px-2 sm:py-1 sm:text-sm";
