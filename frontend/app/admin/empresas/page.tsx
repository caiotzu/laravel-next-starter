"use client";

import { useState } from "react";

import { LaravelPagination } from "@/types/laravel";

import { AppSidebar } from "@/app/admin/_components/layouts/app-sidebar";
import { SiteHeader } from "@/app/admin/_components/layouts/site-header";

import { Pagination } from "@/components/data-tables/Pagination";
import { PageHeader } from "@/components/layouts/page-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

import type { UF } from "@/constants/estados";
import { useEmpresas } from "@/domains/admin/empresa/hooks/useEmpresas";
import { Empresa } from "@/domains/admin/empresa/types/empresa.model";
import { EmpresaListaItem } from "@/domains/admin/empresa/types/empresa.responses";
import { useGrupoEmpresas } from "@/domains/admin/grupo-empresa/hooks/useGrupoEmpresas";
import { GrupoEmpresa } from "@/domains/admin/grupo-empresa/types/grupoEmpresa.model";

import { EmpresasFilters } from "@/features/admin/empresa/components/EmpresasFilters";
import { EmpresasTable } from "@/features/admin/empresa/components/EmpresasTable";
import { GrupoEmpresasTable } from "@/features/admin/grupo-empresa/components/GrupoEmpresasTable";

import { AdminPermissionGuard } from "../_components/guard/AdminPermissionGuard";

export default function Page() {
  const [grupoEmpresaNome, setGrupoEmpresaNome] = useState("");
  const [grupoEmpresaId, setGrupoEmpresaId] = useState<string | undefined>();

  const [matrizNome, setMatrizNome] = useState("");
  const [matrizId, setMatrizId] = useState<string | undefined>();

  const [cnpj, setCnpj] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [inscricaoEstadual, setInscricaoEstadual] = useState("");
  const [inscricaoMunicipal, setInscricaoMunicipal] = useState("");
  const [uf, setUf] = useState<UF | undefined>(undefined);
  const [ativo, setAtivo] = useState(true);
  const [excluido, setExcluido] = useState(false);

  const [page, setPage] = useState(1);
  const [porPagina, setPorPagina] = useState(10);

  // const { data, isLoading } = useGrupoEmpresas({
  //   page: 1,
  //   nome: grupoEmpresaNome,
  //   excluido: false,
  //   por_pagina: 10,
  // });

  // const grupos = data?.data ?? [];

 

  const { data: empresas, isLoading: isLoadingEmpresa } = useEmpresas({
    grupo_empresa_id: grupoEmpresaId,
    matriz_id: matrizId,
    cnpj,
    nome_fantasia: nomeFantasia,
    razao_social: razaoSocial,
    ativo,
    inscricao_estadual: inscricaoEstadual,
    inscricao_municipal: inscricaoMunicipal,
    uf,
    excluido,
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
              {/* <EmpresasFilters
                grupoEmpresaNome={grupoEmpresaNome}
                setGrupoEmpresaNome={(value) => {
                  setGrupoEmpresaNome(value);
                  setPage(1);
                }}
                grupoEmpresaId={grupoEmpresaId}
                setGrupoEmpresaId={setGrupoEmpresaId}
                grupos={grupos}
                isLoadingGrupos={isLoading}
                nomeFantasia={nomeFantasia}
                setNomeFantasia={setNomeFantasia}
                razaoSocial={razaoSocial}
                setRazaoSocial={setRazaoSocial}
                ativo={ativo}
                setAtivo={setAtivo}
                uf={uf}
                setUf={setUf}
                excluido={excluido}
                setExcluido={setExcluido}
                porPagina={porPagina}
                setPorPagina={(value) => {
                  setPage(1);
                  setPorPagina(value);
                }}
              /> */}

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