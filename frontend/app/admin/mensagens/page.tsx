"use client";

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

import { useMensagens } from "@/domains/admin/mensagem/hooks/useMensagens";
import { ListarMensagensRequest } from "@/domains/admin/mensagem/types/mensagem.requests";
import { ListarMensagensResponse } from "@/domains/admin/mensagem/types/mensagem.responses";

import { MensagensFilters } from "@/features/admin/mensagem/components/MensagensFilters";
import { MensagensTable } from "@/features/admin/mensagem/components/MensagensTable";
import { MensagensTableSkeleton } from "@/features/admin/mensagem/components/MensagensTableSkeleton";

export default function Page() {
  const [filters, setFilters] = useState<ListarMensagensRequest>({
    titulo: "",
    page: 1,
    por_pagina: 10,
  });

  const { data, isLoading, error } = useMensagens(filters);
  const pagination = data as ListarMensagensResponse | undefined;

  useEffect(() => {
    if (!error) return;

    const axiosError = error as AxiosError<ApiErrorResponse>;

    toast.error(
      axiosError.response?.data?.errors.business ??
        "Não foi possível carregar os dados.",
      {
        id: "mensagem-page-error",
      }
    );
  }, [error]);

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
              title="Mensagens"
              description="Gerenciamento das mensagens enviadas aos usuários."
              actions={[
                {
                  label: "Enviar mensagem",
                  href: "/admin/mensagens/cadastrar",
                  icon: null,
                  permission: "admin.mensagem.cadastrar",
                  variant: "default",
                },
              ]}
            />

            <AdminPermissionGuard permission="admin.mensagem.listar">
              <MensagensFilters filters={filters} setFilters={setFilters} />

              {isLoading ? (
                <MensagensTableSkeleton />
              ) : (
                <MensagensTable data={data?.data ?? []} />
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
