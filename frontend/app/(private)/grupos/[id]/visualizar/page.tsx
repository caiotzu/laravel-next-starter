"use client";

import { useEffect } from "react";

import { useRouter, useParams } from "next/navigation";

import { AxiosError } from "axios";
import { toast } from "sonner";

import { ApiErrorResponse } from "@/types/errors";

import { PrivatePermissionGuard } from "@/app/(private)/_components/guard/PrivatePermissionGuard";
import { AppSidebar } from "@/app/(private)/_components/layouts/app-sidebar";
import { SiteHeader } from "@/app/(private)/_components/layouts/site-header";

import { PageHeader } from "@/components/layouts/page-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { useGrupo } from "@/domains/private/grupo/hooks/useGrupo";
import { usePermissoes } from "@/domains/private/permissao/hooks/usePermissoes";

import { GrupoFormView } from "@/features/private/grupo/components/GrupoFormView";
import { GrupoFormViewSkeleton } from "@/features/private/grupo/components/GrupoFormViewSkeleton";

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

    router.push("/grupos");
  }, [error, router]);

  const { data: permissoes, isLoading: isLoadingPermissoes, error: errorPermissoes } = usePermissoes();
  useEffect(() => {
    if (!errorPermissoes) return;

    const axiosError = errorPermissoes as AxiosError<ApiErrorResponse>;

    toast.error(
      axiosError.response?.data?.errors.business ??
      "Não foi possível carregar as permissões."
    );

    router.push("/grupos");
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
                  href: "/grupos",
                  icon: null,
                  variant: "default"
                },
              ]}
            />
            
            <PrivatePermissionGuard permission="private.grupo.visualizar">
              {isLoading || !data || isLoadingPermissoes || !permissoes ? (
                <GrupoFormViewSkeleton />
              ) : (
								<GrupoFormView
									grupo={data}
									permissoes={permissoes.data}
								/>
              )}
            </PrivatePermissionGuard>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
