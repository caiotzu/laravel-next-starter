"use client";

import { ReactNode } from "react";

import { useAdminPermission } from "@/app/admin/providers/admin-permission-provider";

import { AccessDenied } from "@/components/feedback/AccessDenied";

interface AdminPermissionGuardProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
  disableFallback?: boolean;
}

export function AdminPermissionGuard({
  permission,
  children,
  fallback,
  disableFallback = false,
}: AdminPermissionGuardProps) {
  const { can } = useAdminPermission();

  if (!can(permission)) {
    if (disableFallback) {
      return null;
    }

    return <>{fallback ?? <AccessDenied />}</>;
  }

  return <>{children}</>;
}
