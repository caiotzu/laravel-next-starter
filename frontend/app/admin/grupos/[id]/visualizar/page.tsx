"use client";

import { useEffect } from "react";

import { useRouter, useParams } from "next/navigation";

import { AxiosError } from "axios";
import { toast } from "sonner";

import { ApiErrorResponse } from "@/types/errors";

import { AdminPermissionGuard } from "@/app/admin/_components/guard/AdminPermissionGuard";
import { AppSidebar } from "@/app/admin/_components/layouts/app-sidebar";
import { SiteHeader } from "@/app/admin/_components/layouts/site-header";

import { PageHeader } from "@/components/layouts/page-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { useGrupo } from "@/domains/admin/grupo/hooks/useGrupo";
import { usePermissoes } from "@/domains/admin/permissao/hooks/usePermissoes";

import { GrupoFormView } from "@/features/admin/grupo/components/GrupoFormView";
import { GrupoFormViewSkeleton } from "@/features/admin/grupo/components/GrupoFormViewSkeleton";

export default function Page() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data, isLoading, error } = useGrupo(id);
  useEffect(() => {
    if (!error) return;

    const axiosError = error as AxiosError<ApiErrorResponse>;

    toast.error(
      axiosError.response?.data?.errors.business ??
      "Não foi possível carregar os dados."
    );

    router.push("/admin/grupos");
  }, [error, router]);

  const { data: permissoes, isLoading: isLoadingPermissoes, error: errorPermissoes } = usePermissoes();
  useEffect(() => {
    if (!errorPermissoes) return;

    const axiosError = errorPermissoes as AxiosError<ApiErrorResponse>;

    toast.error(
      axiosError.response?.data?.errors.business ??
      "Não foi possível carregar as permissões."
    );

    router.push("/admin/grupos");
  }, [errorPermissoes, router]);

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />

        <div className="flex flex-1 flex-col">
          <div className="flex flex-col gap-6 py-6 px-4 lg:px-6">
            <PageHeader
              title="Grupos"
              description="Detalhes do grupo"
              actions={[
                {
                  label: "Voltar",
                  href: "/admin/grupos",
                  icon: null,
                  variant: "default"
                },
              ]}
            />
            
            <AdminPermissionGuard permission="admin.grupo.visualizar">
              {isLoading || !data || isLoadingPermissoes || !permissoes ? (
                <GrupoFormViewSkeleton />
              ) : (
								<GrupoFormView
									grupo={data}
									permissoes={permissoes.data}
								/>
              )}
            </AdminPermissionGuard>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
