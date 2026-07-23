"use client";

import { ReactNode } from "react";

import { usePrivatePermission } from "@/app/(private)/providers/private-permission-provider";

import { AccessDenied } from "@/components/feedback/AccessDenied";

interface PrivatePermissionGuardProps {
  permission?: string;
  permissions?: string[];
  children: ReactNode;
  fallback?: ReactNode;
  disableFallback?: boolean;
}

export function PrivatePermissionGuard({
  permission,
  permissions,
  children,
  fallback,
  disableFallback = false,
}: PrivatePermissionGuardProps) {
  const { can } = usePrivatePermission();

  const hasPermission = permission ? can(permission) : permissions?.some((permission) => can(permission)) ?? false;

  if (!hasPermission) {
    if (disableFallback) {
      return null;
    }

    return <>{fallback ?? <AccessDenied />}</>;
  }

  return <>{children}</>;
}
