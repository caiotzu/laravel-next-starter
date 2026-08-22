"use client";

import { useState } from "react";

import { AdminPermissionGuard } from "@/app/admin/_components/guard/AdminPermissionGuard";
import { AppSidebar } from "@/app/admin/_components/layouts/app-sidebar";
import { SiteHeader } from "@/app/admin/_components/layouts/site-header";

import { Pagination } from "@/components/data-tables/Pagination";
import { PageHeader } from "@/components/layouts/page-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

import { useReleases } from "@/domains/admin/release/hooks/useReleases";

import { ReleasesList } from "@/features/admin/release/components/ReleasesList";

export default function Page() {
  const [page, setPage] = useState(1);

  // Fixado no contexto Admin e em publicadas — mesma tela de "novidades"
  // que o Private tem para o próprio contexto (ver app/(private)/releases/
  // page.tsx). O gerenciamento completo (qualquer contexto/status) fica em
  // /admin/releases/gerenciar.
  const { data, isLoading } = useReleases({ page, contexto: "admin", status: "published" });

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />

        <div className="flex flex-1 flex-col">
          <div className="flex flex-col gap-6 py-6 px-4 lg:px-6">

            <PageHeader
              title="Releases"
              description="Acompanhe as novidades, melhorias e correções do painel administrativo."
              actions={[
                {
                  label: "Gerenciar Releases",
                  href: "/admin/releases/gerenciar",
                  icon: null,
                  permission: "admin.release.cadastrar",
                  variant: "outline",
                },
              ]}
            />

            <AdminPermissionGuard permission="admin.release.listar">
              {isLoading ? (
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : (
                <ReleasesList releases={data?.data ?? []} hrefBase="/admin/releases" />
              )}

              {data && (
                <Pagination
                  currentPage={data.meta.current_page}
                  lastPage={data.meta.last_page}
                  total={data.meta.total}
                  from={data.meta.from ?? 0}
                  to={data.meta.to ?? 0}
                  onPageChange={setPage}
                />
              )}
            </AdminPermissionGuard>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
