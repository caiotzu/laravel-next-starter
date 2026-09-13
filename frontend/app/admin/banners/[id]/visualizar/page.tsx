"use client";

import { useEffect } from "react";

import { useParams, useRouter } from "next/navigation";

import { AxiosError } from "axios";
import { toast } from "sonner";

import { ApiErrorResponse } from "@/types/errors";

import { AdminPermissionGuard } from "@/app/admin/_components/guard/AdminPermissionGuard";
import { AppSidebar } from "@/app/admin/_components/layouts/app-sidebar";
import { SiteHeader } from "@/app/admin/_components/layouts/site-header";

import { PageHeader } from "@/components/layouts/page-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { useBanner } from "@/domains/admin/banner/hooks/useBanner";

import { BannerView } from "@/features/admin/banner/components/BannerView";
import { BannerViewSkeleton } from "@/features/admin/banner/components/BannerViewSkeleton";

export default function Page() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data, isLoading, error } = useBanner(id);

  useEffect(() => {
    if (!error) return;

    const axiosError = error as AxiosError<ApiErrorResponse>;

    toast.error(
      axiosError.response?.data?.errors.business ?? "Não foi possível carregar os dados."
    );

    router.push("/admin/banners");
  }, [error, router]);

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
              description="Detalhes da campanha de banner"
              actions={[
                {
                  label: "Editar",
                  href: `/admin/banners/${id}`,
                  icon: null,
                  permission: "admin.banner.atualizar",
                  variant: "default",
                },
              ]}
            />

            <AdminPermissionGuard permission="admin.banner.visualizar">
              {isLoading || !data ? <BannerViewSkeleton /> : <BannerView banner={data} />}
            </AdminPermissionGuard>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
