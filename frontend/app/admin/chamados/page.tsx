"use client";

import { useState } from "react";

import { AdminPermissionGuard } from "@/app/admin/_components/guard/AdminPermissionGuard";
import { AppSidebar } from "@/app/admin/_components/layouts/app-sidebar";
import { SiteHeader } from "@/app/admin/_components/layouts/site-header";

import { Pagination } from "@/components/data-tables/Pagination";
import { PageHeader } from "@/components/layouts/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

import { CHAMADO_STATUS_OPTIONS } from "@/constants/chamado-status";
import { CHAMADO_TIPO_OPTIONS } from "@/constants/chamado-tipo";
import { useChamados } from "@/domains/admin/chamado/hooks/useChamados";
import { ListarChamadosRequest } from "@/domains/admin/chamado/types/chamado.requests";

import { ChamadosTable } from "@/features/admin/chamado/components/ChamadosTable";

export default function Page() {
  const [filtros, setFiltros] = useState<ListarChamadosRequest>({ page: 1 });

  const { data, isLoading } = useChamados(filtros);

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
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Filtros</CardTitle>
                </CardHeader>

                <CardContent className="flex flex-wrap items-end gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select
                      value={filtros.status ?? "todos"}
                      onValueChange={(value) =>
                        setFiltros((f) => ({
                          ...f,
                          page: 1,
                          status: value === "todos" ? undefined : (value as ListarChamadosRequest["status"]),
                        }))
                      }
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os status</SelectItem>
                        {CHAMADO_STATUS_OPTIONS.map((opcao) => (
                          <SelectItem key={opcao.value} value={opcao.value}>
                            {opcao.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Tipo</label>
                    <Select
                      value={filtros.tipo ?? "todos"}
                      onValueChange={(value) =>
                        setFiltros((f) => ({
                          ...f,
                          page: 1,
                          tipo: value === "todos" ? undefined : (value as ListarChamadosRequest["tipo"]),
                        }))
                      }
                    >
                      <SelectTrigger className="w-56">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os tipos</SelectItem>
                        {CHAMADO_TIPO_OPTIONS.map((opcao) => (
                          <SelectItem key={opcao.value} value={opcao.value}>
                            {opcao.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

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
