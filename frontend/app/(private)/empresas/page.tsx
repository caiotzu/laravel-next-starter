"use client";

import { useState } from "react";

import { PrivatePermissionGuard } from "@/app/(private)/_components/guard/PrivatePermissionGuard";
import { AppSidebar } from "@/app/(private)/_components/layouts/app-sidebar";
import { SiteHeader } from "@/app/(private)/_components/layouts/site-header";

import { Pagination } from "@/components/data-tables/Pagination";
import { PageHeader } from "@/components/layouts/page-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

import { useEmpresas } from "@/domains/private/empresa/hooks/useEmpresas";
import { EmpresaFilters } from "@/domains/private/empresa/types/empresa.filters";
import { Empresa } from "@/domains/private/empresa/types/empresa.model";

import { EmpresasFilters } from "@/features/private/empresa/components/EmpresasFilters";
import { EmpresasTable } from "@/features/private/empresa/components/EmpresasTable";
import { EmpresasTableSkeleton } from "@/features/private/empresa/components/EmpresasTableSkeleton";

export default function Page() {
  const [filters, setFilters] = useState<EmpresaFilters>({
    grupo_empresa_nome: "",
    matriz_nome: "",
    matriz_id: "",
    cnpj: "",
    nome_fantasia: "",
    razao_social: "",
    inscricao_estadual: "",
    inscricao_municipal: "",
    uf: undefined,
    excluido: false,
		page: 1,
		por_pagina: 10,
  });

  const { data: matrizesData, isLoading: isLoadingMatrizes } = useEmpresas({
    page: 1,
    nome_fantasia: filters.matriz_nome,
    excluido: false,
    por_pagina: 10,
  });
  const matrizes = (matrizesData?.data ?? []) as Empresa[];

  const empresaParams = {
    matriz_id: filters.matriz_id,
    cnpj: filters.cnpj,
    nome_fantasia: filters.nome_fantasia,
    razao_social: filters.razao_social,
    inscricao_estadual: filters.inscricao_estadual,
    inscricao_municipal: filters.inscricao_municipal,
    uf: filters.uf,
    excluido: filters.excluido,
    page: filters.page,
    por_pagina: filters.por_pagina,
  };

  const { data: empresas, isLoading: isLoadingEmpresa } = useEmpresas(empresaParams);
  const pagination = empresas;

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
            />

            <PrivatePermissionGuard permission="private.empresa.listar">
              <EmpresasFilters
                filters={filters}
                setFilters={setFilters}
                matrizes={matrizes}
                isLoadingMatrizes={isLoadingMatrizes}
              />

              {isLoadingEmpresa ? (
                <EmpresasTableSkeleton />
              ) : (
                <EmpresasTable data={pagination?.data ?? []} />
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
            </PrivatePermissionGuard>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
