"use client";

import { useState } from "react";

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
import { ListarGruposRequest } from "@/domains/private/grupo/types/grupo.requests";
import { ListarGruposResponse } from "@/domains/private/grupo/types/grupo.responses";

import { GruposFilters } from "@/features/private/grupo/components/GruposFilters";
import { GruposTable } from "@/features/private/grupo/components/GruposTable";
import { GruposTableSkeleton } from "@/features/private/grupo/components/GruposTableSkeleton";

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
                  href: "/grupos/cadastrar",
                  icon: null,
                  permission: "private.grupo.cadastrar",
                  variant: "default"
                },
              ]}
            />

            <PrivatePermissionGuard permission="private.grupo.listar">
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
            </PrivatePermissionGuard>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}