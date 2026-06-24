"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import { ApiErrorResponse } from "@/types/errors";

import { AdminPermissionGuard } from "@/app/admin/_components/guard/AdminPermissionGuard";
import { AppSidebar } from "@/app/admin/_components/layouts/app-sidebar";
import { SiteHeader } from "@/app/admin/_components/layouts/site-header";

import { PageHeader } from "@/components/layouts/page-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

import { cadastrarGrupoEmpresa } from "@/domains/admin/grupo-empresa/services/grupoEmpresaService";
import { GrupoEmpresa } from "@/domains/admin/grupo-empresa/types/grupoEmpresa.model";

import { GrupoEmpresaFormCreate } from "@/features/admin/grupo-empresa/components/GrupoEmpresaFormCreate";
import {GrupoEmpresasFormDataCadastro} from "@/features/admin/grupo-empresa/schemas/grupoEmpresa.schema";

export default function Page() {
  const router = useRouter();

  const [backendErrors, setBackendErrors] = useState<string[] | null>(null);

  const { mutate, isPending } = useMutation<
    GrupoEmpresa,
    AxiosError<ApiErrorResponse>,
    {
      data: GrupoEmpresasFormDataCadastro
      setError: UseFormSetError<GrupoEmpresasFormDataCadastro>
    }
  >({
    mutationFn: ({ data }) => cadastrarGrupoEmpresa(data),
    onSuccess: () => {
      toast.success("Grupo empresa cadastrado com sucesso!");
      router.push("/admin/grupos-empresas");
    },
    onError: (error, variables) => {
      const apiErrors = error.response?.data?.errors;

      if (!apiErrors) {
        setBackendErrors(["Erro ao cadastrar o usuário."]);
        return;
      }

      if ("business" in apiErrors && Array.isArray(apiErrors.business)) {
        setBackendErrors(apiErrors.business);
        return;
      }

      Object.entries(apiErrors).forEach(([field, messages]) => {
        if (!Array.isArray(messages)) return;

        variables.setError(field as keyof GrupoEmpresasFormDataCadastro, {
          type: "server",
          message: messages[0],
        });
      });
    },
  });

  async function handleSubmit(
    data: GrupoEmpresasFormDataCadastro,
    setError: UseFormSetError<GrupoEmpresasFormDataCadastro>
  ) {
    setBackendErrors(null);
    mutate({
      data,
      setError
    })
  }

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
              title="Grupos de Empresas"
              description="Novo grupo de empresas"
            />

            <AdminPermissionGuard permission="admin.grupo_empresa.cadastrar">
              <GrupoEmpresaFormCreate
                onSubmit={handleSubmit}
                isLoading={isPending}
                backendErrors={backendErrors}
                clearBackendErrors={() => setBackendErrors(null)}
              />
            </AdminPermissionGuard>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
