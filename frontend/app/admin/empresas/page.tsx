"use client";

import { useEffect, useState } from "react";

import { LaravelPagination } from "@/types/laravel";

import { AppSidebar } from "@/app/admin/_components/layouts/app-sidebar";
import { SiteHeader } from "@/app/admin/_components/layouts/site-header";

import { Pagination } from "@/components/data-tables/Pagination";
import { PageHeader } from "@/components/layouts/page-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

import { useEmpresas } from "@/domains/admin/empresa/hooks/useEmpresas";
import { EmpresaListaItem } from "@/domains/admin/empresa/types/empresa.responses";
import { useGrupoEmpresas } from "@/domains/admin/grupo-empresa/hooks/useGrupoEmpresas";

import { EmpresasFilters, type EmpresaFilters } from "@/features/admin/empresa/components/EmpresasFilters";
import { EmpresasTable } from "@/features/admin/empresa/components/EmpresasTable";

import { AdminPermissionGuard } from "../_components/guard/AdminPermissionGuard";

export default function Page() {
  const [filters, setFilters] = useState<EmpresaFilters>({
    ativo: true,
    excluido: false,
  });

  const [page, setPage] = useState(1);
  const [porPagina, setPorPagina] = useState(10);

  const [grupoEmpresaNomeDebounced, setGrupoEmpresaNomeDebounced] = useState("");
  const [matrizNomeDebounced, setMatrizNomeDebounced] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setGrupoEmpresaNomeDebounced(filters.grupoEmpresaNome ?? "");
    }, 300);

    return () => clearTimeout(timeout);
  }, [filters.grupoEmpresaNome]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setMatrizNomeDebounced(filters.matrizNome ?? "");
    }, 300);

    return () => clearTimeout(timeout);
  }, [filters.matrizNome]);

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

  const { data: gruposData, isLoading: isLoadingGrupos } = useGrupoEmpresas({
    page: 1,
    nome: grupoEmpresaNomeDebounced || undefined,
    excluido: false,
    por_pagina: 10,
  });

  const grupos = gruposData?.data ?? [];

  const { data: matrizesData, isLoading: isLoadingMatrizes } = useEmpresas({
    page: 1,
    nome_fantasia: matrizNomeDebounced || undefined,
    excluido: false,
    por_pagina: 10,
  });

  const matrizes = matrizesData?.data ?? [];

  const idValue = filters.id ?? "";
  const cnpjValue = filters.cnpj ?? "";
  const idFiltro = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idValue)
    ? idValue
    : undefined;
  const cnpjFiltro = cnpjValue.length === 14 ? cnpjValue : undefined;

  const { data: empresas, isLoading: isLoadingEmpresa } = useEmpresas({
    id: idFiltro,
    grupo_empresa_id: filters.grupoEmpresaId,
    matriz_id: filters.matrizId,
    cnpj: cnpjFiltro,
    nome_fantasia: filters.nomeFantasia,
    razao_social: filters.razaoSocial,
    ativo: filters.ativo,
    inscricao_estadual: filters.inscricaoEstadual,
    inscricao_municipal: filters.inscricaoMunicipal,
    uf: filters.uf,
    excluido: filters.excluido,
    page,
    por_pagina: porPagina,
  });
  const pagination = empresas as LaravelPagination<EmpresaListaItem> | undefined;

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
                  currentPage={pagination.current_page}
                  lastPage={pagination.last_page}
                  total={pagination.total}
                  from={pagination.from ?? 0}
                  to={pagination.to ?? 0}
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
