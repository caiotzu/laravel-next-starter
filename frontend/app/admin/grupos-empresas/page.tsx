"use client";

// React / libs externas
import { useState } from "react";

import { useRouter } from "next/navigation";

// Tipos globais
import { Lock } from "lucide-react";

import { LaravelPagination } from "@/types/laravel";

// Layout / Shared components
import { AppSidebar } from "@/app/admin/_components/layouts/app-sidebar";
import { SiteHeader } from "@/app/admin/_components/layouts/site-header";
import { useAdminPermission } from "@/app/admin/providers/admin-permission-provider";

import { Pagination } from "@/components/data-tables/Pagination";
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

// Feature: grupo-empresa
import { GrupoEmpresasFilters } from "@/features/admin/grupo-empresa/components/GrupoEmpresasFilters";
import { GrupoEmpresasTable } from "@/features/admin/grupo-empresa/components/GrupoEmpresasTable";
import { useGrupoEmpresas } from "@/features/admin/grupo-empresa/hooks/useGrupoEmpresas";
import { GrupoEmpresa } from "@/features/admin/grupo-empresa/types/grupoEmpresa.model";

import { AdminPermissionGuard } from "../_components/guard/AdminPermissionGuard";

export default function Page() {
  const router = useRouter();
  const { can } = useAdminPermission();

  const [page, setPage] = useState(1);
  const [nome, setNome] = useState("");
  const [excluido, setExcluido] = useState(false);
  const [porPagina, setPorPagina] = useState(10);

  const { data, isLoading } = useGrupoEmpresas({
    page,
    nome,
    excluido,
    porPagina,
  });

  const pagination = data as LaravelPagination<GrupoEmpresa> | undefined;

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

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Grupos de Empresas
                </h1>
                <p className="text-sm text-muted-foreground">
                  Gerencie os grupos de empresas cadastrados.
                </p>
              </div>

              <AdminPermissionGuard permission="admin.grupo_empresa.cadastrar" disableFallback={true}>
                <Button 
                  onClick={() => router.push("/admin/grupos-empresas/cadastrar")} 
                  className="cursor-pointer"
                >
                  Cadastrar
                </Button>
              </AdminPermissionGuard>
            </div>

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
