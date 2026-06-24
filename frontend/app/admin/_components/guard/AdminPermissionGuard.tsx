"use client";

import { ReactNode } from "react";

import { useAdminPermission } from "@/app/admin/providers/admin-permission-provider";

import { AccessDenied } from "@/components/feedback/AccessDenied";

interface AdminPermissionGuardProps {
  permission?: string;
  permissions?: string[];
  children: ReactNode;
  fallback?: ReactNode;
  disableFallback?: boolean;
}

export function AdminPermissionGuard({
  permission,
  permissions,
  children,
  fallback,
  disableFallback = false,
}: AdminPermissionGuardProps) {
  const { can } = useAdminPermission();

  const hasPermission = permission ? can(permission) : permissions?.some((permission) => can(permission)) ?? false;

  if (!hasPermission) {
    if (disableFallback) {
      return null;
    }

    return <>{fallback ?? <AccessDenied />}</>;
  }

  return <>{children}</>;
}
