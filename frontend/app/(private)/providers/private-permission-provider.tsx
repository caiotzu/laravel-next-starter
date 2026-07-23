"use client"

import { createContext, useContext, useMemo } from "react"

import { useUserPrivate } from "@/hooks/use-user-private"

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

export function PrivatePermissionProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useUserPrivate()

  const permissionSet = useMemo(
    () => new Set(data?.permissoes ?? []),
    [data?.permissoes]
  )

  const value = useMemo(() => ({
    permissions: permissionSet,
    isLoading,
    can: (permission: string) => permissionSet.has(permission),
  }), [permissionSet, isLoading])

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  )
}

export const usePrivatePermission = () => useContext(PermissionContext)
