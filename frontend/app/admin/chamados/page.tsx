"use client";

import { useState } from "react";

import { AdminPermissionGuard } from "@/app/admin/_components/guard/AdminPermissionGuard";
import { AppSidebar } from "@/app/admin/_components/layouts/app-sidebar";
import { SiteHeader } from "@/app/admin/_components/layouts/site-header";

import { Pagination } from "@/components/data-tables/Pagination";
import { PageHeader } from "@/components/layouts/page-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";


import { useChamados } from "@/domains/admin/chamado/hooks/useChamados";
import { ListarChamadosRequest } from "@/domains/admin/chamado/types/chamado.requests";
import { useAdministradores } from "@/domains/admin/lookup/hooks/useAdministradores";
import { useDebouncedValue } from "@/hooks/use-debounce";

import { ChamadosFilters } from "@/features/admin/chamado/components/ChamadosFilters";
import { ChamadosTable } from "@/features/admin/chamado/components/ChamadosTable";

export default function Page() {
  const [filtros, setFiltros] = useState<ListarChamadosRequest>({ page: 1 });
  const [buscaResponsavel, setBuscaResponsavel] = useState("");

  const buscaDebounced = useDebouncedValue(buscaResponsavel, 300);

  const { data, isLoading } = useChamados(filtros);
  const { data: administradores, isLoading: carregandoAdmins } = useAdministradores({
    busca: buscaDebounced,
  });

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
              title="Chamados"
              description="Acompanhe e responda os chamados abertos pelos clientes."
            />

            <AdminPermissionGuard permission="admin.chamado.listar">
              <ChamadosFilters
                filtros={filtros}
                setFiltros={setFiltros}
                administradores={administradores ?? []}
                carregandoAdmins={carregandoAdmins}
                buscaResponsavel={buscaResponsavel}
                setBuscaResponsavel={setBuscaResponsavel}
              />

              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ChamadosTable chamados={data?.data ?? []} hrefBase="/admin/chamados" />
              )}

              {data && (
                <Pagination
                  currentPage={data.meta.current_page}
                  lastPage={data.meta.last_page}
                  total={data.meta.total}
                  from={data.meta.from ?? 0}
                  to={data.meta.to ?? 0}
                  onPageChange={(page) => setFiltros((f) => ({ ...f, page }))}
                />
              )}
            </AdminPermissionGuard>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
