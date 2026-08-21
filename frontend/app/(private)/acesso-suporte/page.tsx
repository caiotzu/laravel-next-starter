"use client";

import { useState } from "react";

import { PrivatePermissionGuard } from "@/app/(private)/_components/guard/PrivatePermissionGuard";
import { AppSidebar } from "@/app/(private)/_components/layouts/app-sidebar";
import { PageHeader } from "@/app/(private)/_components/layouts/page-header";
import { SiteHeader } from "@/app/(private)/_components/layouts/site-header";

import { Pagination } from "@/components/data-tables/Pagination";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

import { useAcessosSuporte } from "@/domains/private/acesso-suporte/hooks/useAcessosSuporte";

import { AcessosSuporteTable } from "@/features/private/acesso-suporte/components/AcessosSuporteTable";

export default function Page() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAcessosSuporte({ page });

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
              title="Acesso de Suporte"
              description="Conceda acesso temporário à sua organização para que um administrador realize suporte."
              actions={[
                {
                  label: "Conceder acesso",
                  href: "/acesso-suporte/conceder",
                  icon: null,
                  permission: "private.acesso_suporte.conceder",
                  variant: "default",
                },
              ]}
            />

            <PrivatePermissionGuard permission="private.acesso_suporte.listar">
              {isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <AcessosSuporteTable data={data?.data ?? []} />
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
            </PrivatePermissionGuard>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
