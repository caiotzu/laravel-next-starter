"use client";

import { useEffect, useState } from "react";

import { LaravelResourcePagination } from "@/types/laravel";

import { AppSidebar } from "@/app/admin/_components/layouts/app-sidebar";
import { SiteHeader } from "@/app/admin/_components/layouts/site-header";

import { Pagination } from "@/components/data-tables/Pagination";
import { PageHeader } from "@/components/layouts/page-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

import { useEmpresas } from "@/domains/admin/empresa/hooks/useEmpresas";
import { EmpresaFilters } from "@/domains/admin/empresa/types/empresa.filters";
import { Empresa } from "@/domains/admin/empresa/types/empresa.model";
import { EmpresaListaItem } from "@/domains/admin/empresa/types/empresa.responses";
import { useGrupoEmpresas } from "@/domains/admin/grupo-empresa/hooks/useGrupoEmpresas";
import { GrupoEmpresa } from "@/domains/admin/grupo-empresa/types/grupoEmpresa.model";

import { EmpresasFilters } from "@/features/admin/empresa/components/EmpresasFilters";
import { EmpresasTable } from "@/features/admin/empresa/components/EmpresasTable";

import { AdminPermissionGuard } from "../_components/guard/AdminPermissionGuard";

export default function Page() {
  const [filters, setFilters] = useState<EmpresaFilters>({
    excluido: false,
  });

  const [page, setPage] = useState(1);
  const [porPagina, setPorPagina] = useState(10);

  const [grupoEmpresaNome, setGrupoEmpresaNome] = useState("");
  const [matrizNome, setMatrizNome] = useState("");

  const { data: gruposData, isLoading: isLoadingGrupos } = useGrupoEmpresas({
    page: 1,
    nome: grupoEmpresaNome || undefined,
    excluido: false,
    por_pagina: 10,
  });
  const grupos = (gruposData?.data ?? []) as GrupoEmpresa[];

  const { data: matrizesData, isLoading: isLoadingMatrizes } = useEmpresas({
    page: 1,
    nome_fantasia: matrizNome || undefined,
    excluido: false,
    por_pagina: 10,
  });
  const matrizes = (matrizesData?.data ?? []) as Empresa[];

  const { data: empresas, isLoading: isLoadingEmpresa } = useEmpresas({
    grupo_empresa_id: filters.grupo_empresa_id,
    matriz_id: filters.matriz_id,
    cnpj: filters.cnpj,
    nome_fantasia: filters.nome_fantasia,
    razao_social: filters.razao_social,
    inscricao_estadual: filters.inscricao_estadual,
    inscricao_municipal: filters.inscricao_municipal,
    uf: filters.uf,
    excluido: filters.excluido,
    page,
    por_pagina: porPagina,
  });
  const pagination = empresas as LaravelResourcePagination<EmpresaListaItem> | undefined;

  function updateFilter<K extends keyof EmpresaFilters>(
    key: K,
    value: EmpresaFilters[K]
  ) {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setPage(1);
  }

  console.log('grupos', grupos);
  console.log('matrizes', matrizes);
  console.log('pagination', pagination);

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
              title="Empresas"
              description="Gerencie as empresas cadastradas."
              actions={[
                {
                  label: "Cadastrar",
                  href: "/admin/empresas/cadastrar",
                  icon: null,
                  permission: "admin.empresa.cadastrar",
                  variant: "default",
                },
              ]}
            />

            <AdminPermissionGuard permission="admin.empresa.listar">
              <EmpresasFilters
                filters={filters}
                updateFilter={updateFilter}
                grupos={grupos}
                isLoadingGrupos={isLoadingGrupos}
                matrizes={matrizes}
                isLoadingMatrizes={isLoadingMatrizes}
                porPagina={porPagina}
                setPorPagina={(value) => {
                  setPage(1);
                  setPorPagina(value);
                }}
              />

              <EmpresasTable
                data={pagination?.data ?? []}
                isLoading={isLoadingEmpresa}
              />

              {pagination && (
                <Pagination
                  currentPage={pagination.meta.current_page}
                  lastPage={pagination.meta.last_page}
                  total={pagination.meta.total}
                  from={pagination.meta.from ?? 0}
                  to={pagination.meta.to ?? 0}
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


