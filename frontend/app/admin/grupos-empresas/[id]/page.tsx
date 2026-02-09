"use client";

import { useEffect, useState } from "react";

import { useRouter, useParams } from "next/navigation";

import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

import { ApiErrorResponse } from "@/types/errors";

import { AppSidebar } from "@/app/admin/_components/layouts/app-sidebar";
import { SiteHeader } from "@/app/admin/_components/layouts/site-header";

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

import { GrupoEmpresaForm } from "@/features/grupo-empresa/components/GrupoEmpresaForm";
import { useGrupoEmpresa } from "@/features/grupo-empresa/hooks/useGrupoEmpresa";
import { GrupoEmpresasFormData } from "@/features/grupo-empresa/schemas/grupoEmpresa.schema";
import { 
    visualizarGrupoEmpresa, 
    editarGrupoEmpresa 
} from "@/features/grupo-empresa/services/grupoEmpresaService";
import { EditarGrupoEmpresaResponse } from "@/features/grupo-empresa/types/grupoEmpresa.responses";

export default function Page() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [backendErrors, setBackendErrors] = useState<string[] | null>(null);

  const { data, isLoading } = useGrupoEmpresa(id);

  const { mutateAsync, isPending } = useMutation<
    EditarGrupoEmpresaResponse,
    AxiosError<ApiErrorResponse>,
    GrupoEmpresasFormData
  >({
    mutationFn: (formData) =>
      editarGrupoEmpresa(id, formData),

    onSuccess: () => {
      toast.success("Grupo atualizado com sucesso!");
      router.push("/admin/grupos-empresas");
    },

    onError: (error) => {
      const apiData = error.response?.data;

      const messages: string[] =
        apiData?.messages?.length
          ? apiData.messages
          : ["Erro ao atualizar grupo."];

      setBackendErrors(messages);
    },
  });

  async function handleSubmit(data: GrupoEmpresasFormData) {
    setBackendErrors(null);
    await mutateAsync(data);
  }

  const defaultValues: GrupoEmpresasFormData | undefined = data ? { nome: data.nome }: undefined;

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

            <GrupoEmpresaForm
              defaultValues={defaultValues}
              onSubmit={handleSubmit}
              isLoading={isPending || isLoading}
              backendErrors={backendErrors}
              clearBackendErrors={() => setBackendErrors(null)}
            />

          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
