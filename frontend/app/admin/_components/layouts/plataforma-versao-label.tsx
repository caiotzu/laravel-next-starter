"use client"

import { Badge } from "@/components/ui/badge"

import { useVersaoPlataforma } from "@/domains/admin/versao/hooks/useVersaoPlataforma"

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
