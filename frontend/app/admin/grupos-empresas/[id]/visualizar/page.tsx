"use client";

import { useEffect } from "react";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";

import { AxiosError } from "axios";
import { toast } from "sonner";

import { ApiErrorResponse } from "@/types/errors";

import { AdminPermissionGuard } from "@/app/admin/_components/guard/AdminPermissionGuard";
import { AppSidebar } from "@/app/admin/_components/layouts/app-sidebar";
import { SiteHeader } from "@/app/admin/_components/layouts/site-header";

import { PageHeader } from "@/components/layouts/page-header";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { GrupoEmpresaVisualizacao } from "@/features/admin/grupo-empresa/components/GrupoEmpresaVisualizacao";
import { GrupoEmpresaVisualizacaoSkeleton } from "@/features/admin/grupo-empresa/components/GrupoEmpresaVisualizacaoSkeleton";
import { useGrupoEmpresa } from "@/features/admin/grupo-empresa/hooks/useGrupoEmpresa";


export default function Page() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data, isLoading, error } = useGrupoEmpresa(id);

  useEffect(() => {
    if (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      toast.error(axiosError.response?.data?.errors.business || "Grupo não encontrado.");
      router.push("/admin/grupos-empresas");
    }
  }, [error, router]);

  if (isLoading || !data) {
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
              <GrupoEmpresaVisualizacaoSkeleton />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

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
              description="Gerencie os grupos de empresas cadastrados."
              actions={[
                {
                  label: "Voltar para listagem",
                  href: "/admin/grupos-empresas",
                  icon: null,
                  variant: "default"
                },
              ]}
            />

            <AdminPermissionGuard permission="admin.grupo_empresa.visualizar">
              <GrupoEmpresaVisualizacao grupoEmpresa={data} />
            </AdminPermissionGuard>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
