"use client";

import { useEffect, useState } from "react";

import { useRouter, useParams } from "next/navigation";

import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import { ApiErrorResponse } from "@/types/errors";

import { AdminPermissionGuard } from "@/app/admin/_components/guard/AdminPermissionGuard";
import { AppSidebar } from "@/app/admin/_components/layouts/app-sidebar";
import { SiteHeader } from "@/app/admin/_components/layouts/site-header";

import { PageHeader } from "@/components/layouts/page-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { useGrupo } from "@/domains/admin/grupo/hooks/useGrupo";
import { editarGrupo } from "@/domains/admin/grupo/services/grupoService";
import { Grupo } from "@/domains/admin/grupo/types/grupo.model";
import { usePermissoes } from "@/domains/admin/permissao/hooks/usePermissoes";

import { GrupoFormEdit } from "@/features/admin/grupo/components/GrupoFormEdit";
import { GrupoFormDataEdicao } from "@/features/admin/grupo/schemas/grupo.schema";

export default function Page() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();

  const [backendErrors, setBackendErrors] = useState<string[] | null>(null);

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


  const { mutate, isPending } = useMutation<
    Grupo,
    AxiosError<ApiErrorResponse>, 
    {
      data: GrupoFormDataEdicao
      setError: UseFormSetError<GrupoFormDataEdicao>
    }
  >({
    mutationFn: ({ data }) => editarGrupo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grupo", id] });
      toast.success("Grupo e permissões atualizados com sucesso!");
      router.push("/admin/grupos");
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
  
          variables.setError(field as keyof GrupoFormDataEdicao, {
            type: "server",
            message: messages[0],
          });
        });
      },
  });

  console.log('data', data);
  console.log('permissões', permissoes);

  async function handleSubmit(
    data: GrupoFormDataEdicao,
    setError: UseFormSetError<GrupoFormDataEdicao>
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
              description="Edição de grupo de empresas"
            />

            <AdminPermissionGuard permission="admin.grupo.atualizar">
                {/* <h1>Chegou aqui na edição</h1> */}
              {isLoading || !data || isLoadingPermissoes || !permissoes ? (
                // <GrupoEmpresaFormEdicaoSkeleton />
                <h1>Carregando</h1>
              ) : (
                <GrupoFormEdit
                  onSubmit={handleSubmit}
                  isLoading={isPending || isLoading}
                  backendErrors={backendErrors}
                  clearBackendErrors={() => setBackendErrors(null)}
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
