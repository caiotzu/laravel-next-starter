"use client";

import { useEffect, useState } from "react";

import { useRouter, useParams } from "next/navigation";

import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import { ApiErrorResponse } from "@/types/errors";

import { AppSidebar } from "@/app/admin/_components/layouts/app-sidebar";
import { SiteHeader } from "@/app/admin/_components/layouts/site-header";

import { PageHeader } from "@/components/layouts/page-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { useGrupoEmpresa } from "@/domains/admin/grupo-empresa/hooks/useGrupoEmpresa";
import { editarGrupoEmpresa } from "@/domains/admin/grupo-empresa/services/grupoEmpresaService";
import { GrupoEmpresa } from "@/domains/admin/grupo-empresa/types/grupoEmpresa.model";

import { GrupoEmpresaFormEdicao } from "@/features/admin/grupo-empresa/components/GrupoEmpresaFormEdicao";
import { GrupoEmpresaFormEdicaoSkeleton } from "@/features/admin/grupo-empresa/components/GrupoEmpresaFormEdicaoSkeleton";
import { GrupoEmpresasFormDataEdicao } from "@/features/admin/grupo-empresa/schemas/grupoEmpresa.schema";

import { AdminPermissionGuard } from "../../_components/guard/AdminPermissionGuard";

export default function Page() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();

  const [backendErrors, setBackendErrors] = useState<string[] | null>(null);

  const { data, isLoading, error } = useGrupoEmpresa(id);
  useEffect(() => {
    if (!error) return;

    const axiosError = error as AxiosError<ApiErrorResponse>;

    toast.error(
      axiosError.response?.data?.errors.business ??
      "Não foi possível carregar os dados."
    );

    router.push("/admin/grupos-empresas");
  }, [error, router]);

  const { mutate, isPending } = useMutation<
    GrupoEmpresa,
    AxiosError<ApiErrorResponse>, 
    {
      data: GrupoEmpresasFormDataEdicao
      setError: UseFormSetError<GrupoEmpresasFormDataEdicao>
    }
  >({
    mutationFn: ({ data }) => editarGrupoEmpresa(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grupo-empresa", id] });
      toast.success("Grupo empresa atualizado com sucesso!");
      router.push("/admin/grupos-empresas");
    },
    onError: (error, variables) => {
        const apiErrors = error.response?.data?.errors;
  
        if (!apiErrors) {
          setBackendErrors(["Erro ao editar o usuário."]);
          return;
        }
  
        if ("business" in apiErrors && Array.isArray(apiErrors.business)) {
          setBackendErrors(apiErrors.business);
          return;
        }
  
        Object.entries(apiErrors).forEach(([field, messages]) => {
          if (!Array.isArray(messages)) return;
  
          variables.setError(field as keyof GrupoEmpresasFormDataEdicao, {
            type: "server",
            message: messages[0],
          });
        });
      },
  });

  async function handleSubmit(
    data: GrupoEmpresasFormDataEdicao,
    setError: UseFormSetError<GrupoEmpresasFormDataEdicao>
  ) {
    setBackendErrors(null);

    mutate({
      data,
      setError
    })
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
            />

            <AdminPermissionGuard permission="admin.grupo_empresa.atualizar">
              {isLoading || !data ? (
                <GrupoEmpresaFormEdicaoSkeleton />
              ) : (
                <GrupoEmpresaFormEdicao
                  onSubmit={handleSubmit}
                  isLoading={isPending || isLoading}
                  backendErrors={backendErrors}
                  clearBackendErrors={() => setBackendErrors(null)}
                  grupoEmpresa={data}
                />
              )}
            </AdminPermissionGuard>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
