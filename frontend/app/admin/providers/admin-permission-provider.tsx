"use client"

import { createContext, useContext, useMemo } from "react"

import { usePathname } from "next/navigation"

import { useUserAdmin } from "@/hooks/use-user-admin"
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
 * Mesmo problema e mesma correção do PrivatePermissionProvider (ver
 * app/(private)/providers/private-permission-provider.tsx): o layout do
 * Admin é compartilhado por TODAS as rotas do grupo, inclusive as públicas
 * (`/admin`, `/admin/esqueceu-senha`, `/admin/primeiro-acesso`,
 * `/admin/redefinir-senha`) — que não exigem `admin_access_token`. Chamar
 * `/admin/me` incondicionalmente nessas rotas sempre retorna 401, e
 * proxyAdminRequest redireciona para "/admin" (ver lib/proxy-admin.ts),
 * derrubando o usuário de `/admin/primeiro-acesso?token=...` de volta para
 * o login antes dele conseguir definir a senha.
 *
 * Reaproveita a mesma lista de rotas do middleware.ts (routes/routes.ts)
 * para decidir se a rota atual realmente exige permissões.
 */
function exigePermissoesAdmin(pathname: string): boolean {
  return protectedRoutes.some(
    (route) =>
      route.cookieName === "admin_access_token" &&
      route.protected &&
      route.regex?.test(pathname)
  )
}

export function AdminPermissionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const precisaDePermissoes = exigePermissoesAdmin(pathname)

  const { data, isLoading } = useUserAdmin({ enabled: precisaDePermissoes })

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

export const useAdminPermission = () => useContext(PermissionContext)
