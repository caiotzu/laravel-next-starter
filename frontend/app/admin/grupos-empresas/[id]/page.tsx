"use client";

import { useMemo, useState, useEffect } from "react";

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

import { GrupoEmpresaFormEdicao } from "@/features/admin/grupo-empresa/components/GrupoEmpresaFormEdicao";
import { GrupoEmpresaFormEdicaoSkeleton } from "@/features/admin/grupo-empresa/components/GrupoEmpresaFormEdicaoSkeleton";
import { useGrupoEmpresa } from "@/features/admin/grupo-empresa/hooks/useGrupoEmpresa";
import { GrupoEmpresasFormDataEdicao } from "@/features/admin/grupo-empresa/schemas/grupoEmpresa.schema";
import { editarGrupoEmpresa } from "@/features/admin/grupo-empresa/services/grupoEmpresaService";
import { EditarGrupoEmpresaResponse } from "@/features/admin/grupo-empresa/types/grupoEmpresa.responses";

import { AdminPermissionGuard } from "../../_components/guard/AdminPermissionGuard";

export default function Page() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();

  const [backendErrors, setBackendErrors] = useState<string[] | null>(null);
  const [formSetError, setFormSetError] = useState<UseFormSetError<GrupoEmpresasFormDataEdicao> | null>(null);

  const { data, isLoading, error } = useGrupoEmpresa(id);

  useEffect(() => {
    if (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      toast.error(axiosError.response?.data?.errors.business || "Grupo não encontrado.");
      router.push("/admin/grupos-empresas");
    }
  }, [error, router]);

  const defaultValues = useMemo(() => {
    if (!data) return undefined;
    return { nome: data.nome };
  }, [data]);

  const { mutateAsync, isPending } = useMutation<
    EditarGrupoEmpresaResponse,
    AxiosError<ApiErrorResponse>,
    GrupoEmpresasFormDataEdicao
  >({
    mutationFn: (formData) => editarGrupoEmpresa(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grupo-empresa", id] });
      toast.success("Grupo atualizado com sucesso!");
      router.push("/admin/grupos-empresas");
    },
    onError: (error) => {
      const apiErrors = error.response?.data?.errors;

      if (!apiErrors) {
        setBackendErrors(["Erro ao atualizar grupo."]);
        return;
      }

      if (apiErrors.business) {
        setBackendErrors(apiErrors.business);
      }

      if (formSetError) {
        Object.entries(apiErrors).forEach(([field, messages]) => {
          if (!messages || field === "business") return;

          formSetError(field as keyof GrupoEmpresasFormDataEdicao, {
            type: "server",
            message: messages[0],
          });
        });
      }
    },
  });

  async function handleSubmit(data: GrupoEmpresasFormDataEdicao) {
    setBackendErrors(null);
    await mutateAsync(data);
  }

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
              <GrupoEmpresaFormEdicaoSkeleton />
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
            />

            <AdminPermissionGuard permission="admin.grupo_empresa.atualizar">
              <GrupoEmpresaFormEdicao
                defaultValues={defaultValues}
                onSubmit={handleSubmit}
                isLoading={isPending || isLoading}
                backendErrors={backendErrors}
                clearBackendErrors={() => setBackendErrors(null)}
                registerSetError={(fn) => setFormSetError(() => fn)}
              />
            </AdminPermissionGuard>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
