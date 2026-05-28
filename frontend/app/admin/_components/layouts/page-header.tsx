"use client";

import { ReactNode } from "react";

import Link from "next/link";

import { AdminPermissionGuard } from "@/app/admin/_components/guard/AdminPermissionGuard";

import { Button } from "@/components/ui/button";

type ButtonVariant =
  | "default"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive";

interface PageHeaderAction {
  label: string;
  href: string;
  icon?: ReactNode;
  permission?: string;
  variant?: ButtonVariant;
  target?: "_self" | "_blank";
}

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: PageHeaderAction[];
  children?: ReactNode;
}

export function PageHeader({
  title,
  description,
  actions = [],
  children,
}: PageHeaderProps) {
  function renderAction(action: PageHeaderAction, index: number) {
    const button = (
      <Button
        key={`action-${index}`}
        variant={action.variant ?? "outline"}
        asChild
        className="gap-2"
      >
        <Link href={action.href} target={action.target ?? "_self"}>
          {action.icon && (
            <span className="flex items-center">
              {action.icon}
            </span>
          )}
          {action.label}
        </Link>
      </Button>
    );

    if (action.permission) {
      return (
        <AdminPermissionGuard
          key={`guard-${index}`}
          permission={action.permission}
          disableFallback
        >
          {button}
        </AdminPermissionGuard>
      );
    }

    return button;
  }

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      {/* Título */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {title}
        </h1>

        {description && (
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        )}

        {children}
      </div>

      {/* Ações */}
      {actions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {actions.map(renderAction)}
        </div>
      )}
    </div>
  );
}
