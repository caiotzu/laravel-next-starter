"use client"

import { createContext, useContext } from "react"

import { usePathname } from "next/navigation"

import { useCaixaContadorMensagensNaoLidas } from "@/domains/admin/mensagem/hooks/useCaixaContadorMensagensNaoLidas"
import { protectedRoutes } from "@/routes/routes"

const CaixaMensagemContadorContext = createContext<number>(0)

/**
 * Mesmo problema e mesma correção do MensagemContadorProvider do Private
 * (ver app/(private)/providers/mensagem-contador-provider.tsx): o SiteHeader
 * do Admin também é montado individualmente por cada page.tsx, em vez de
 * viver no layout persistente, então o contador remonta a cada navegação.
 */
function exigePermissoesAdmin(pathname: string): boolean {
  return protectedRoutes.some(
    (route) =>
      route.cookieName === "admin_access_token" &&
      route.protected &&
      route.regex?.test(pathname)
  )
}

export function CaixaMensagemContadorProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const habilitado = exigePermissoesAdmin(pathname)

  const { data: totalNaoLidas = 0 } = useCaixaContadorMensagensNaoLidas({ enabled: habilitado })

  return (
    <CaixaMensagemContadorContext.Provider value={totalNaoLidas}>
      {children}
    </CaixaMensagemContadorContext.Provider>
  )
}

export const useCaixaMensagemContador = () => useContext(CaixaMensagemContadorContext)
