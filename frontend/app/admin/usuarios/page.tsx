"use client"

import { useEffect, useState } from "react";

import { AxiosError } from "axios";
import { toast } from "sonner";

import { ApiErrorResponse } from "@/types/errors";

import { AdminPermissionGuard } from "@/app/admin/_components/guard/AdminPermissionGuard";
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
import { UsuariosTable } from "@/features/admin/usuario/components/UsuariosTable";
import { UsuariosTableSkeleton } from "@/features/admin/usuario/components/UsuariosTableSkeleton";

export default function Page() {
  const [filters, setFilters] = useState<ListarUsuariosRequest>({
    nome: "",
    grupo_id: "",
    excluido: false,
    page: 1,
    por_pagina: 10,
  });
  
  const { data, isLoading, error } = useUsuarios(filters);
  const pagination = data as ListarUsuariosResponse | undefined;

  const { data: grupos, isLoading: isLoadingGrupos, error: errorGrupos } = useGrupos();

  useEffect(() => {
    const currentError = error || errorGrupos;
    if (!currentError) return;

    const axiosError = currentError as AxiosError<ApiErrorResponse>;

    toast.error(
      axiosError.response?.data?.errors.business ??
      "Não foi possível carregar os dados.",
      {
        id: "usuarios-page-error", // evita de mostrar várias vezes mesmo erro se acontecer na filtragem
      }
    );
  }, [error, errorGrupos]);

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
              description="Gerenciamento de usuários"
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
              <UsuariosFilters 
                filters={filters}
                setFilters={setFilters}
                grupos={grupos?.data ?? []}
                isLoadingGrupos={isLoadingGrupos}
              />
              
              {isLoading ? (
                <UsuariosTableSkeleton />
              ): (
                <UsuariosTable
                  data={data?.data ?? []}
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