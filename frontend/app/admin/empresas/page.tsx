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

import type { UF } from "@/constants/estados";
import { useEmpresas } from "@/domains/admin/empresa/hooks/useEmpresas";
import { EmpresaListaItem } from "@/domains/admin/empresa/types/empresa.responses";
import { useGrupoEmpresas } from "@/domains/admin/grupo-empresa/hooks/useGrupoEmpresas";

import { EmpresasFilters } from "@/features/admin/empresa/components/EmpresasFilters";
import { EmpresasTable } from "@/features/admin/empresa/components/EmpresasTable";

import { AdminPermissionGuard } from "../_components/guard/AdminPermissionGuard";

export default function Page() {
  const [id, setId] = useState("");
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

  const [grupoEmpresaNomeDebounced, setGrupoEmpresaNomeDebounced] = useState("");
  const [matrizNomeDebounced, setMatrizNomeDebounced] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setGrupoEmpresaNomeDebounced(grupoEmpresaNome);
    }, 300);

    return () => clearTimeout(timeout);
  }, [grupoEmpresaNome]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setMatrizNomeDebounced(matrizNome);
    }, 300);

    return () => clearTimeout(timeout);
  }, [matrizNome]);

  const { data: gruposData, isLoading: isLoadingGrupos } = useGrupoEmpresas({
    page: 1,
    nome: grupoEmpresaNomeDebounced || undefined,
    excluido: false,
    por_pagina: 10,
  });

  const grupos = gruposData?.data ?? [];

  console.log(matrizNomeDebounced)
  const { data: matrizesData, isLoading: isLoadingMatrizes } = useEmpresas({
    page: 1,
    nome_fantasia: matrizNomeDebounced || undefined,
    excluido: false,
    por_pagina: 10,
  });

  const matrizes = matrizesData?.data ?? [];

  const idFiltro = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    ? id
    : undefined;
  const cnpjFiltro = cnpj.length === 14 ? cnpj : undefined;

  const { data: empresas, isLoading: isLoadingEmpresa } = useEmpresas({
    id: idFiltro,
    grupo_empresa_id: grupoEmpresaId,
    matriz_id: matrizId,
    cnpj: cnpjFiltro,
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
              <EmpresasFilters
                id={id}
                setId={(value) => {
                  setId(value);
                  setPage(1);
                }}
                grupoEmpresaNome={grupoEmpresaNome}
                setGrupoEmpresaNome={(value) => {
                  setGrupoEmpresaNome(value);
                  setPage(1);
                }}
                grupoEmpresaId={grupoEmpresaId}
                setGrupoEmpresaId={(value) => {
                  setGrupoEmpresaId(value);
                  setPage(1);
                }}
                grupos={grupos}
                isLoadingGrupos={isLoadingGrupos}
                matrizNome={matrizNome}
                setMatrizNome={(value) => {
                  setMatrizNome(value);
                  setPage(1);
                }}
                matrizId={matrizId}
                setMatrizId={(value) => {
                  setMatrizId(value);
                  setPage(1);
                }}
                matrizes={matrizes}
                isLoadingMatrizes={isLoadingMatrizes}
                cnpj={cnpj}
                setCnpj={(value) => {
                  setCnpj(value);
                  setPage(1);
                }}
                nomeFantasia={nomeFantasia}
                setNomeFantasia={(value) => {
                  setNomeFantasia(value);
                  setPage(1);
                }}
                razaoSocial={razaoSocial}
                setRazaoSocial={(value) => {
                  setRazaoSocial(value);
                  setPage(1);
                }}
                inscricaoEstadual={inscricaoEstadual}
                setInscricaoEstadual={(value) => {
                  setInscricaoEstadual(value);
                  setPage(1);
                }}
                inscricaoMunicipal={inscricaoMunicipal}
                setInscricaoMunicipal={(value) => {
                  setInscricaoMunicipal(value);
                  setPage(1);
                }}
                ativo={ativo}
                setAtivo={(value) => {
                  setAtivo(value);
                  setPage(1);
                }}
                uf={uf}
                setUf={(value) => {
                  setUf(value);
                  setPage(1);
                }}
                excluido={excluido}
                setExcluido={(value) => {
                  setExcluido(value);
                  setPage(1);
                }}
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
