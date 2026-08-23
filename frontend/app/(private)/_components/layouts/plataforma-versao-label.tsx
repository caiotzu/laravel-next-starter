"use client"

import { Badge } from "@/components/ui/badge"

import { useVersaoPlataforma } from "@/domains/private/versao/hooks/useVersaoPlataforma"

/**
 * Versão sempre vem do backend (GET /version) — nunca hardcoded aqui. Ver
 * domains/private/versao/hooks/useVersaoPlataforma.ts.
 */
export function PlataformaVersaoLabel() {
  const { data: versao } = useVersaoPlataforma()

  if (!versao) return null

  return (
    <Badge 
      className="text-[10px] group-data-[collapsible=icon]:hidden font-bold"
      variant="outline"
    >
      v{versao}
    </Badge>
  )
}
