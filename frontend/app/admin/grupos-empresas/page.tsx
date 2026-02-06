"use client";

import { useState } from "react";

import GrupoEmpresasTable from "@/features/grupo-empresa/components/GrupoEmpresasTable";
import { GrupoEmpresasFilters } from "@/features/grupo-empresa/components/GrupoEmpresasFilters";
import { Pagination } from "@/components/data-tables/Pagination";

import { useGrupoEmpresas } from "@/features/grupo-empresa/hooks/useGrupoEmpresas";
import { GrupoEmpresa } from "@/features/grupo-empresa/types";
import { LaravelPagination } from "@/types/laravel";

import { AppSidebar } from "@/app/admin/_components/layouts/app-sidebar";
import { SiteHeader } from "@/app/admin/_components/layouts/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

export default function Page() {
  const [page, setPage] = useState(1);
  const [porPagina, setPorPagina] = useState(10);
  const [nome, setNome] = useState("");

  const { data, isLoading } = useGrupoEmpresas({
    page,
    porPagina,
    nome,
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

            <GrupoEmpresasFilters
              nome={nome}
              setNome={setNome}
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

          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
