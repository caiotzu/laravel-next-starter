"use client";

import { useState } from "react";

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
import { ListarGruposRequest } from "@/domains/admin/grupo/types/grupo.requests";
import { ListarGruposResponse } from "@/domains/admin/grupo/types/grupo.responses";

import { GruposFilters } from "@/features/admin/grupo/components/GruposFilters";
import { GruposTable } from "@/features/admin/grupo/components/GruposTable";
import { GruposTableSkeleton } from "@/features/admin/grupo/components/GruposTableSkeleton";

export default function Page() {
	const [filters, setFilters] = useState<ListarGruposRequest>({
		descricao: "",
		excluido: false,
		page: 1,
		por_pagina: 10,
	});

	const { data, isLoading } = useGrupos(filters);
	const pagination = data as ListarGruposResponse | undefined;

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
              title="Grupos"
              description="Gerenciamento de grupos"
              actions={[
                {
                  label: "Cadastrar",
                  href: "/admin/grupos/cadastrar",
                  icon: null,
                  permission: "admin.grupo.cadastrar",
                  variant: "default"
                },
              ]}
            />

            <AdminPermissionGuard permission="admin.grupo.listar">
              <GruposFilters 
                filters={filters}
                setFilters={setFilters}
              />
              
              {isLoading ? (
                <GruposTableSkeleton />
              ): (
                <GruposTable
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