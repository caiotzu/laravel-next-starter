"use client"

import { useEffect, useState } from "react";

import { AxiosError } from "axios";
import { toast } from "sonner";

import { ApiErrorResponse } from "@/types/errors";

import { PrivatePermissionGuard } from "@/app/(private)/_components/guard/PrivatePermissionGuard";
import { AppSidebar } from "@/app/(private)/_components/layouts/app-sidebar";
import { PageHeader } from "@/app/(private)/_components/layouts/page-header";
import { SiteHeader } from "@/app/(private)/_components/layouts/site-header";

import { Pagination } from "@/components/data-tables/Pagination";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

import { useGrupos } from "@/domains/private/grupo/hooks/useGrupos";
import { useUsuarios } from "@/domains/private/usuario/hooks/useUsuarios";
import { ListarUsuariosRequest } from "@/domains/private/usuario/types/usuario.requests";
import { ListarUsuariosResponse } from "@/domains/private/usuario/types/usuario.responses";

import { UsuariosFilters } from "@/features/private/usuario/components/UsuariosFilters";
import { UsuariosTable } from "@/features/private/usuario/components/UsuariosTable";
import { UsuariosTableSkeleton } from "@/features/private/usuario/components/UsuariosTableSkeleton";


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
                  href: "/usuarios/cadastrar",
                  icon: null,
                  permission: "private.usuario.cadastrar",
                  variant: "default"
                },
              ]}
            />

            <PrivatePermissionGuard permission="private.usuario.listar">
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
            </PrivatePermissionGuard>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}