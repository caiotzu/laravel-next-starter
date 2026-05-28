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

import { useUsuarios } from "@/domains/admin/usuario/hooks/useUsuarios";
import { ListarUsuarioRequest } from "@/domains/admin/usuario/types/usuario.requests";
import { ListarUsuariosResponse } from "@/domains/admin/usuario/types/usuario.responses";

import { UsuariosFilters } from "@/features/admin/usuario/components/UsuariosFilters";
import { UsuariosTable } from "@/features/admin/usuario/components/UsuariosTable";

import { AdminPermissionGuard } from "../_components/guard/AdminPermissionGuard";


export default function Page() {
  const [filters, setFilters] = useState<ListarUsuarioRequest>({
    nome: "",
    excluido: false,
    page: 1,
    por_pagina: 10,
  });
  
  const { data, isLoading } = useUsuarios(filters);
  const pagination = data as ListarUsuariosResponse | undefined;

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
                  href: "/admin/grupos-empresas/cadastrar",
                  icon: null,
                  permission: "admin.grupo_empresa.cadastrar",
                  variant: "default"
                },
              ]}
            />

            <AdminPermissionGuard permission="admin.usuario.listar">
              <UsuariosFilters 
                filters={filters}
                setFilters={setFilters}
              />

              <UsuariosTable
                data={data?.data ?? []}
                isLoading={isLoading}
              />

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