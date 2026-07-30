"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import { ApiErrorResponse } from "@/types/errors";

import { PrivatePermissionGuard } from "@/app/(private)/_components/guard/PrivatePermissionGuard";
import { AppSidebar } from "@/app/(private)/_components/layouts/app-sidebar";
import { PageHeader } from "@/app/(private)/_components/layouts/page-header";
import { SiteHeader } from "@/app/(private)/_components/layouts/site-header";

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

import { cadastrarGrupo } from "@/domains/private/grupo/services/grupoService";
import { Grupo } from "@/domains/private/grupo/types/grupo.model";

import { GrupoFormCreate } from "@/features/private/grupo/components/GrupoFormCreate";
import { GrupoFormDataCadastro } from "@/features/private/grupo/schemas/grupo.schema";

export default function Page() {
  const router = useRouter();

  const [backendErrors, setBackendErrors] = useState<string[] | null>(null);

  const {mutate, isPending} = useMutation<
    Grupo,
    AxiosError<ApiErrorResponse>,
    {
      data: GrupoFormDataCadastro
      setError: UseFormSetError<GrupoFormDataCadastro>
    }
  >({
    mutationFn: ({ data }) => cadastrarGrupo(data),
    onSuccess: ( grupo ) => {
      toast.success("Grupo cadastrado com sucesso! Agora defina as permissões");
      router.push(`/grupos/${grupo.id}`);
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

        variables.setError(field as keyof GrupoFormDataCadastro, {
          type: "server",
          message: messages[0],
        });
      });
    },
  });

  async function handleSubmit(
    data: GrupoFormDataCadastro,
    setError: UseFormSetError<GrupoFormDataCadastro>
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
              title="Grupos"
              description="Novo grupo"
            />

            <PrivatePermissionGuard permission="private.grupo.cadastrar">
              <GrupoFormCreate
                onSubmit={handleSubmit}
                isLoading={isPending}
                backendErrors={backendErrors}
                clearBackendErrors={() => setBackendErrors(null)}
              />
            </PrivatePermissionGuard>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}