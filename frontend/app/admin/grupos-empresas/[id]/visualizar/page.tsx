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

import { useGrupoEmpresa } from "@/domains/admin/grupo-empresa/hooks/useGrupoEmpresa";

import { GrupoEmpresaView } from "@/features/admin/grupo-empresa/components/GrupoEmpresaView";
import { GrupoEmpresaViewSkeleton } from "@/features/admin/grupo-empresa/components/GrupoEmpresaViewSkeleton";


export default function Page() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data, isLoading, error } = useGrupoEmpresa(id);
  useEffect(() => {
    if (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;

      toast.error(
        axiosError.response?.data?.errors.business ?? 
        "Não foi possível carregar os dados."
      );
      
      router.push("/admin/grupos-empresas");
    }
  }, [error, router]);

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
              title="Grupos de Empresas"
              description="Detalhes do grupo de empresas"
              actions={[
                {
                  label: "Voltar",
                  href: "/admin/grupos-empresas",
                  icon: null,
                  variant: "default"
                },
              ]}
            />

            <AdminPermissionGuard permission="admin.grupo_empresa.visualizar">
              {isLoading || !data ? (
                <GrupoEmpresaViewSkeleton />
              ) : (
                <GrupoEmpresaView grupoEmpresa={data} />
              )}
            </AdminPermissionGuard>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
