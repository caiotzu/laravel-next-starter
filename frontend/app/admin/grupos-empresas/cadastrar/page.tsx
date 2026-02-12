"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import { ApiErrorResponse } from "@/types/errors";

import { AppSidebar } from "@/app/admin/_components/layouts/app-sidebar";
import { SiteHeader } from "@/app/admin/_components/layouts/site-header";

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

import { GrupoEmpresaForm } from "@/features/grupo-empresa/components/GrupoEmpresaForm";
import { GrupoEmpresasFormData } from "@/features/grupo-empresa/schemas/grupoEmpresa.schema";
import { cadastrarGrupoEmpresa } from "@/features/grupo-empresa/services/grupoEmpresaService";
import { CadastrarGrupoEmpresaResponse } from "@/features/grupo-empresa/types/grupoEmpresa.responses";

import { AdminPermissionGuard } from "../../_components/guard/AdminPermissionGuard";
import { useAdminPermission } from "../../providers/admin-permission-provider";


export default function Page() {
  const router = useRouter();
  const { can } = useAdminPermission();
  

  const [backendErrors, setBackendErrors] = useState<string[] | null>(null);
  const [formError, setFormError] = useState<UseFormSetError<GrupoEmpresasFormData> | null>(null);

  const { mutateAsync, isPending } = useMutation<
    CadastrarGrupoEmpresaResponse,
    AxiosError<ApiErrorResponse>,
    GrupoEmpresasFormData
  >({
    mutationFn: cadastrarGrupoEmpresa,

    onSuccess: () => {
      toast.success("Grupo cadastrado com sucesso!");
      router.push("/admin/grupos-empresas");
    },

    onError: (error) => {
      const apiErrors = error.response?.data?.errors;

      if (!apiErrors) {
        setBackendErrors(["Erro ao cadastrar grupo."]);
        return;
      }

      if (apiErrors.business) {
        setBackendErrors(apiErrors.business);
        return;
      }

      if (formError) {
        Object.entries(apiErrors).forEach(([field, messages]) => {
          if (!messages || field === "business") return;

          formError(field as keyof GrupoEmpresasFormData, {
            type: "server",
            message: messages[0],
          });
        });
      }
    },
  });

  async function handleSubmit(data: GrupoEmpresasFormData) {
    setBackendErrors(null);
    await mutateAsync(data);
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

            <AdminPermissionGuard permission="admin.grupo_empresa.cadastrar">
              <GrupoEmpresaForm
                onSubmit={handleSubmit}
                isLoading={isPending}
                backendErrors={backendErrors}
                clearBackendErrors={() => setBackendErrors(null)}
                registerSetError={(fn) => setFormError(() => fn)}
              />
            </AdminPermissionGuard>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
