"use client";

import { useState } from "react";

import { AppSidebar } from "@/app/admin/_components/layouts/app-sidebar";
import { PageHeader } from "@/app/admin/_components/layouts/page-header";
import { SiteHeader } from "@/app/admin/_components/layouts/site-header";

import { Pagination } from "@/components/data-tables/Pagination";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

import { useGrupoEmpresas } from "@/domains/admin/grupo-empresa/hooks/useGrupoEmpresas";
import { ListarGrupoEmpresasRequest } from "@/domains/admin/grupo-empresa/types/grupoEmpresa.requests";
import { ListarGrupoEmpresasResponse } from "@/domains/admin/grupo-empresa/types/grupoEmpresa.responses";

import { GrupoEmpresasFilters } from "@/features/admin/grupo-empresa/components/GrupoEmpresasFilters";
import { GrupoEmpresasTable } from "@/features/admin/grupo-empresa/components/GrupoEmpresasTable";
import { GrupoEmpresasTableSkeleton } from "@/features/admin/grupo-empresa/components/GrupoEmpresasTableSkeleton";

import { AdminPermissionGuard } from "../_components/guard/AdminPermissionGuard";

export default function Page() {
  const [filters, setFilters] = useState<ListarGrupoEmpresasRequest>({
    nome: "",
    excluido: false,
    page: 1,
    por_pagina: 10
  });

  const { data, isLoading } = useGrupoEmpresas(filters);
  const pagination = data as ListarGrupoEmpresasResponse | undefined;
  
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
              title="Grupos de Empresas"
              description="Gerencie os grupos de empresas cadastrados."
              actions={[
                {
                  label: "Cadastrar",
                  href: "/admin/grupos-empresas/cadastrar",
                  icon: null,
                  permission: "admin.grupo_empresa.cadastrar",
                  variant: "default"
                },
              ]}
            />

            <AdminPermissionGuard permission="admin.grupo_empresa.listar">
              <GrupoEmpresasFilters
                filters={filters}
                setFilters={setFilters}
              />

              {isLoading ? (
                <GrupoEmpresasTableSkeleton />
              ) : (
                <GrupoEmpresasTable
                  data={data?.data ?? []}
                  isLoading={isLoading}
                />
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
