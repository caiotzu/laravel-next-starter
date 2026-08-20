"use client"

import { createContext, useContext, useMemo } from "react"

import { usePathname } from "next/navigation"

import { useUserPrivate } from "@/hooks/use-user-private"
import { protectedRoutes } from "@/routes/routes"

type PermissionContextType = {
  can: (permission: string) => boolean
  permissions: Set<string>
  isLoading: boolean
}

const PermissionContext = createContext<PermissionContextType>({
  can: () => false,
  permissions: new Set(),
  isLoading: true,
})

/**
 * O layout de (private) é compartilhado por TODAS as rotas do grupo,
 * inclusive as públicas (`/`, `/esqueceu-senha`, `/primeiro-acesso`,
 * `/redefinir-senha`) — que não exigem `private_access_token`. Antes desta
 * checagem, este provider chamava `/me` incondicionalmente em toda rota;
 * numa rota pública, sem cookie válido, isso sempre voltava 401 e o
 * proxyPrivateRequest redirecionava para "/", derrubando o usuário de
 * `/primeiro-acesso?token=...` de volta para o login antes mesmo dele
 * conseguir definir a senha.
 *
 * Reaproveita a mesma lista de rotas do middleware.ts (routes/routes.ts)
 * para decidir se a rota atual realmente exige permissões — sem duplicar
 * essa regra em um segundo lugar.
 */
function exigePermissoesPrivate(pathname: string): boolean {
  return protectedRoutes.some(
    (route) =>
      route.cookieName === "private_access_token" &&
      route.protected &&
      route.regex?.test(pathname)
  )
}

export function PrivatePermissionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const precisaDePermissoes = exigePermissoesPrivate(pathname)

  const { data, isLoading } = useUserPrivate({ enabled: precisaDePermissoes })

  const permissionSet = useMemo(
    () => new Set(data?.permissoes ?? []),
    [data?.permissoes]
  )

  const value = useMemo(() => ({
    permissions: permissionSet,
    isLoading: precisaDePermissoes ? isLoading : false,
    can: (permission: string) => permissionSet.has(permission),
  }), [permissionSet, isLoading, precisaDePermissoes])

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  )
}

export const usePrivatePermission = () => useContext(PermissionContext)
