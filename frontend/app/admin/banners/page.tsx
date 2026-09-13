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
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { useBanners } from "@/domains/admin/banner/hooks/useBanners";
import { BannerFiltros } from "@/domains/admin/banner/types/banner.filters";

import { BannersFilters } from "@/features/admin/banner/components/BannersFilters";
import { BannersTable } from "@/features/admin/banner/components/BannersTable";
import { BannersTableSkeleton } from "@/features/admin/banner/components/BannersTableSkeleton";

export default function Page() {
  const [filters, setFilters] = useState<BannerFiltros>({
    titulo: "",
    status: "",
    page: 1,
    por_pagina: 10,
  });

  const { data, isLoading, error } = useBanners(filters);

  useEffect(() => {
    if (!error) return;

    const axiosError = error as AxiosError<ApiErrorResponse>;

    toast.error(
      axiosError.response?.data?.errors.business ?? "Não foi possível carregar os dados.",
      { id: "banner-page-error" }
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
              title="Banners"
              description="Gerenciamento de campanhas de banners exibidas no Private"
              actions={[
                {
                  label: "Cadastrar",
                  href: "/admin/banners/cadastrar",
                  icon: null,
                  permission: "admin.banner.cadastrar",
                  variant: "default",
                },
              ]}
            />

            <AdminPermissionGuard permission="admin.banner.listar">
              <BannersFilters filters={filters} setFilters={setFilters} />

              {isLoading ? (
                <BannersTableSkeleton />
              ) : (
                <BannersTable data={data?.data ?? []} />
              )}

              {data && (
                <Pagination
                  currentPage={data.meta.current_page}
                  lastPage={data.meta.last_page}
                  total={data.meta.total}
                  from={data.meta.from ?? 0}
                  to={data.meta.to ?? 0}
                  onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
                />
              )}
            </AdminPermissionGuard>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
