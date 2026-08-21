"use client";

import { useState } from "react";

import { AdminPermissionGuard } from "@/app/admin/_components/guard/AdminPermissionGuard";
import { AppSidebar } from "@/app/admin/_components/layouts/app-sidebar";
import { SiteHeader } from "@/app/admin/_components/layouts/site-header";

import { Pagination } from "@/components/data-tables/Pagination";
import { PageHeader } from "@/components/layouts/page-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

import { useAcessosSuporteRecebidos } from "@/domains/admin/acesso-suporte/hooks/useAcessosSuporteRecebidos";

import { AcessosSuporteRecebidosTable } from "@/features/admin/acesso-suporte/components/AcessosSuporteRecebidosTable";

export default function Page() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAcessosSuporteRecebidos({ page });

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
              title="Acessos de Suporte"
              description="Acessos temporários concedidos por clientes para você realizar suporte."
            />

            <AdminPermissionGuard permission="admin.acesso_suporte.listar">
              {isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <AcessosSuporteRecebidosTable data={data?.data ?? []} />
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
