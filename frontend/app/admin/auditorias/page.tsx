"use client";

import { useState } from "react";

import { AxiosError } from "axios";

import { ApiErrorResponse } from "@/types/errors";

import { AdminPermissionGuard } from "@/app/admin/_components/guard/AdminPermissionGuard";
import { AppSidebar } from "@/app/admin/_components/layouts/app-sidebar";
import { SiteHeader } from "@/app/admin/_components/layouts/site-header";

import { Pagination } from "@/components/data-tables/Pagination";
import { AppAlert } from "@/components/feedback/AppAlert";
import { PageHeader } from "@/components/layouts/page-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";


import { useAuditoriaEntidadeRegistros } from "@/domains/admin/auditoria/hooks/useAuditoriaEntidadeRegistros";
import { useAuditoriaEntidades } from "@/domains/admin/auditoria/hooks/useAuditoriaEntidades";
import { useAuditorias } from "@/domains/admin/auditoria/hooks/useAuditorias";
import { AuditoriaFilters } from "@/domains/admin/auditoria/types/auditoria.filters";

import { AuditoriasFilters } from "@/features/admin/auditoria/components/AuditoriasFilters";
import { AuditoriasTable } from "@/features/admin/auditoria/components/AuditoriasTable";
import { AuditoriasTableSkeleton } from "@/features/admin/auditoria/components/AuditoriasTableSkeleton";

export default function Page() {
  const [filters, setFilters] = useState<AuditoriaFilters>({
    entidade_tabela: "",
    entidade_id: "",
    entidade_nome: "",
    acao: "",
    usuario_id: "",
    usuario_nome: "",
    data_inicio: "",
    data_fim: "",
    incluir_dependentes: false,
    page: 1,
    por_pagina: 10,
  });

  const { data: usuarios = [], isLoading: isLoadingUsuarios } =
    useAuditoriaEntidadeRegistros("usuarios", {
      busca: filters.usuario_nome,
      por_pagina: 10,
    });
  const { data: entidades = [] } = useAuditoriaEntidades();

  const {
    data: auditorias,
    isLoading: isLoadingAuditorias,
    isError: isErrorAuditorias,
    error: errorAuditorias,
  } = useAuditorias(filters);
  const pagination = auditorias;

  const apiErrors = (errorAuditorias as AxiosError<ApiErrorResponse> | null)
    ?.response?.data?.errors;

  const errorMessages: string[] | null = apiErrors
    ? apiErrors.business ??
      Object.entries(apiErrors)
        .filter(([field]) => field !== "business")
        .flatMap(([, messages]) => messages ?? [])
    : isErrorAuditorias
    ? ["Erro ao carregar as auditorias."]
    : null;

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
              title="Auditoria"
              description="Histórico de alterações realizadas no sistema."
            />

            <AdminPermissionGuard permission="admin.auditoria.listar">
              {errorMessages && errorMessages.length > 0 && (
                <AppAlert
                  variant="error"
                  subtitle="Ocorreu um erro ao carregar as auditorias"
                  messages={errorMessages}
                />
              )}

              <AuditoriasFilters
                filters={filters}
                setFilters={setFilters}
                usuarios={usuarios}
                isLoadingUsuarios={isLoadingUsuarios}
                entidades={entidades}
              />

              {isLoadingAuditorias ? (
                <AuditoriasTableSkeleton />
              ) : (
                <AuditoriasTable data={pagination?.data ?? []} />
              )}

              {pagination && (
                <Pagination
                  currentPage={pagination.meta.current_page}
                  lastPage={pagination.meta.last_page}
                  total={pagination.meta.total}
                  from={pagination.meta.from ?? 0}
                  to={pagination.meta.to ?? 0}
                  onPageChange={(page) =>
                    setFilters((prev) => ({
                      ...prev,
                      page,
                    }))
                  }
                />
              )}
            </AdminPermissionGuard>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
