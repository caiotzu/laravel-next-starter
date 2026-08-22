"use client"

import { useVersaoPlataforma } from "@/domains/admin/versao/hooks/useVersaoPlataforma"

export function PlataformaVersaoLabel() {
  const { data: versao } = useVersaoPlataforma()

  if (!versao) return null

  return (
    <p className="px-2 pb-1 text-[10px] text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">
      v{versao}
    </p>
  )
}
