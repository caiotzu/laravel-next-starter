"use client"

import { useState } from "react";

import { AppSidebar } from "@/app/admin/_components/layouts/app-sidebar";
import { PageHeader } from "@/app/admin/_components/layouts/page-header";
import { SiteHeader } from "@/app/admin/_components/layouts/site-header";

import { Pagination } from "@/components/data-tables/Pagination";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

import { useGrupos } from "@/domains/admin/grupo/hooks/useGrupos";
import { useUsuarios } from "@/domains/admin/usuario/hooks/useUsuarios";
import { ListarUsuariosRequest } from "@/domains/admin/usuario/types/usuario.requests";
import { ListarUsuariosResponse } from "@/domains/admin/usuario/types/usuario.responses";

import { UsuariosFilters } from "@/features/admin/usuario/components/UsuariosFilters";
import { UsuariosFiltersSkeleton } from "@/features/admin/usuario/components/UsuariosFiltersSkeleton";
import { UsuariosTable } from "@/features/admin/usuario/components/UsuariosTable";
import { UsuariosTableSkeleton } from "@/features/admin/usuario/components/UsuariosTableSkeleton";

import { AdminPermissionGuard } from "../_components/guard/AdminPermissionGuard";

export default function Page() {
  const [filters, setFilters] = useState<ListarUsuariosRequest>({
    nome: "",
    grupo_id: "",
    excluido: false,
    page: 1,
    por_pagina: 10,
  });
  
  const { data, isLoading } = useUsuarios(filters);
  const pagination = data as ListarUsuariosResponse | undefined;

  const { data: grupos, isLoading: isLoadingGrupos } = useGrupos();

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
              title="Usuários"
              description="Gerencie os usuários cadastrados."
              actions={[
                {
                  label: "Cadastrar",
                  href: "/admin/usuarios/cadastrar",
                  icon: null,
                  permission: "admin.usuario.cadastrar",
                  variant: "default"
                },
              ]}
            />

            <AdminPermissionGuard permission="admin.usuario.listar">
              {isLoadingGrupos ? (
                <UsuariosFiltersSkeleton />
              ) : (
                <UsuariosFilters 
                  filters={filters}
                  setFilters={setFilters}
                  grupos={grupos?.data ?? []}
                  isLoadingGrupos={isLoadingGrupos}
                />
              )}

              {isLoading ? (
                <UsuariosTableSkeleton />
              ): (
                <UsuariosTable
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