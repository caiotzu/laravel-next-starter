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


import { CHAMADO_PRIORIDADE_OPTIONS } from "@/constants/chamado-prioridade";
import { CHAMADO_STATUS_OPTIONS } from "@/constants/chamado-status";
import { CHAMADO_TIPO_OPTIONS } from "@/constants/chamado-tipo";
import { useChamados } from "@/domains/admin/chamado/hooks/useChamados";
import { ListarChamadosRequest } from "@/domains/admin/chamado/types/chamado.requests";
import { useAdministradores } from "@/domains/admin/lookup/hooks/useAdministradores";
import { useDebouncedValue } from "@/hooks/use-debounce";

import { ChamadosTable } from "@/features/admin/chamado/components/ChamadosTable";

const TODOS_RESPONSAVEIS = "todos";

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

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Prioridade</label>
                    <Select
                      value={filtros.prioridade ?? "todos"}
                      onValueChange={(value) =>
                        setFiltros((f) => ({
                          ...f,
                          page: 1,
                          prioridade: value === "todos" ? undefined : (value as ListarChamadosRequest["prioridade"]),
                        }))
                      }
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Prioridade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todas as prioridades</SelectItem>
                        {CHAMADO_PRIORIDADE_OPTIONS.map((opcao) => (
                          <SelectItem key={opcao.value} value={opcao.value}>
                            {opcao.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Responsável</label>
                    <Select
                      value={filtros.responsavel_id ?? TODOS_RESPONSAVEIS}
                      onValueChange={(value) =>
                        setFiltros((f) => ({
                          ...f,
                          page: 1,
                          responsavel_id: value === TODOS_RESPONSAVEIS ? undefined : value,
                        }))
                      }
                    >
                      <SelectTrigger className="w-56">
                        <SelectValue placeholder="Responsável" />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="px-2 pb-2">
                          <input
                            value={buscaResponsavel}
                            onChange={(e) => setBuscaResponsavel(e.target.value)}
                            placeholder="Buscar por nome ou e-mail..."
                            className="w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring dark:bg-input/30"
                            onKeyDown={(e) => e.stopPropagation()}
                          />
                        </div>

                        <SelectItem value={TODOS_RESPONSAVEIS}>Todos os responsáveis</SelectItem>

                        {carregandoAdmins && (
                          <div className="px-2 py-2 text-sm text-muted-foreground">Buscando...</div>
                        )}

                        {administradores?.map((admin) => (
                          <SelectItem key={admin.id} value={admin.id}>
                            {admin.nome} — {admin.email}
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
