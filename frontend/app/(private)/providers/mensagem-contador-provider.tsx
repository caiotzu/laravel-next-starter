"use client"

import { createContext, useContext } from "react"

import { usePathname } from "next/navigation"

import { useContadorMensagensNaoLidas } from "@/domains/private/mensagem/hooks/useContadorMensagensNaoLidas"
import { protectedRoutes } from "@/routes/routes"

const MensagemContadorContext = createContext<number>(0)

/**
 * Causa do sino "atrasado" ao navegar: o SiteHeader (e o botão de sino
 * dentro dele) é montado individualmente por CADA page.tsx da área
 * Private, em vez de viver no layout persistente — então toda navegação
 * client-side desmonta e remonta o componente que fazia
 * useContadorMensagensNaoLidas(), reiniciando o polling/staleTime a cada
 * troca de tela.
 *
 * Este provider move a MESMA query (mesma queryKey, então as invalidações
 * feitas por useMarcarMensagemComoLida/useMarcarTodasMensagensComoLidas
 * continuam funcionando normalmente) para o layout persistente, então ela
 * fica montada uma única vez por sessão — sobrevive à navegação entre
 * telas — em vez de recriada a cada page.tsx.
 *
 * Mesmo cuidado do PrivatePermissionProvider: só habilita a busca em rotas
 * realmente protegidas, para não repetir o problema de 401 em rota pública
 * (ver private-permission-provider.tsx).
 */
function exigePermissoesPrivate(pathname: string): boolean {
  return protectedRoutes.some(
    (route) =>
      route.cookieName === "private_access_token" &&
      route.protected &&
      route.regex?.test(pathname)
  )
}

export function MensagemContadorProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const habilitado = exigePermissoesPrivate(pathname)

  const { data: totalNaoLidas = 0 } = useContadorMensagensNaoLidas({ enabled: habilitado })

  return (
    <MensagemContadorContext.Provider value={totalNaoLidas}>
      {children}
    </MensagemContadorContext.Provider>
  )
}

export const useMensagemContador = () => useContext(MensagemContadorContext)
