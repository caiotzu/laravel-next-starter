"use client";

import { useState } from "react";

import { LaravelResourcePagination } from "@/types/laravel";

import { AppSidebar } from "@/app/admin/_components/layouts/app-sidebar";
import { SiteHeader } from "@/app/admin/_components/layouts/site-header";

import { Pagination } from "@/components/data-tables/Pagination";
import { PageHeader } from "@/components/layouts/page-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

import { useGrupoEmpresas } from "@/domains/admin/grupo-empresa/hooks/useGrupoEmpresas";
import { GrupoEmpresa } from "@/domains/admin/grupo-empresa/types/grupoEmpresa.model";

import { GrupoEmpresasFilters } from "@/features/admin/grupo-empresa/components/GrupoEmpresasFilters";
import { GrupoEmpresasTable } from "@/features/admin/grupo-empresa/components/GrupoEmpresasTable";

import { AdminPermissionGuard } from "../_components/guard/AdminPermissionGuard";

export default function Page() {
  const [page, setPage] = useState(1);
  const [nome, setNome] = useState("");
  const [excluido, setExcluido] = useState(false);
  const [porPagina, setPorPagina] = useState(10);

  const { data, isLoading } = useGrupoEmpresas({
    page,
    nome,
    excluido,
    por_pagina: porPagina,
  });

  const pagination = data as LaravelResourcePagination<GrupoEmpresa> | undefined;

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
                nome={nome}
                setNome={setNome}
                excluido={excluido}
                setExcluido={setExcluido}
                porPagina={porPagina}
                setPorPagina={(value) => {
                  setPage(1);
                  setPorPagina(value);
                }}
              />

              <GrupoEmpresasTable
                data={pagination?.data ?? []}
                isLoading={isLoading}
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
