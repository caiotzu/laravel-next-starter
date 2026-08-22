"use client"

import { useVersaoPlataforma } from "@/domains/private/versao/hooks/useVersaoPlataforma"

/**
 * Versão sempre vem do backend (GET /version) — nunca hardcoded aqui. Ver
 * domains/private/versao/hooks/useVersaoPlataforma.ts.
 */
export function PlataformaVersaoLabel() {
  const { data: versao } = useVersaoPlataforma()

  if (!versao) return null

  return (
    <p className="px-2 pb-1 text-[10px] text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">
      v{versao}
    </p>
  )
}
