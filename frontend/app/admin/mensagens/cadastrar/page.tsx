"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import { ApiErrorResponse } from "@/types/errors";

import { AdminPermissionGuard } from "@/app/admin/_components/guard/AdminPermissionGuard";
import { AppSidebar } from "@/app/admin/_components/layouts/app-sidebar";
import { PageHeader } from "@/app/admin/_components/layouts/page-header";
import { SiteHeader } from "@/app/admin/_components/layouts/site-header";

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

import { cadastrarMensagem } from "@/domains/admin/mensagem/services/mensagemService";
import { Mensagem } from "@/domains/admin/mensagem/types/mensagem.model";
import { CadastrarMensagemRequest } from "@/domains/admin/mensagem/types/mensagem.requests";

import { MensagemFormCreate } from "@/features/admin/mensagem/components/MensagemFormCreate";
import { MensagemFormDataCadastro } from "@/features/admin/mensagem/schemas/mensagem.schema";

export default function Page() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [backendErrors, setBackendErrors] = useState<string[] | null>(null);
  const [formError] = useState<UseFormSetError<MensagemFormDataCadastro> | null>(null);

  const { mutateAsync, isPending } = useMutation<
    Mensagem,
    AxiosError<ApiErrorResponse>,
    CadastrarMensagemRequest
  >({
    mutationFn: cadastrarMensagem,
    onSuccess: () => {
      toast.success("Mensagem enviada com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["mensagens"] });
      router.push("/admin/mensagens");
    },
    onError: (error) => {
      const apiErrors = error.response?.data?.errors;

      if (!apiErrors) {
        setBackendErrors(["Erro ao enviar mensagem."]);
        return;
      }

      if (apiErrors.business) {
        setBackendErrors(apiErrors.business);
        return;
      }

      if (formError) {
        Object.entries(apiErrors).forEach(([field, messages]) => {
          if (!messages || field === "business") return;

          formError(field as keyof MensagemFormDataCadastro, {
            type: "server",
            message: messages[0],
          });
        });
      }
    },
  });

  async function handleSubmit(data: MensagemFormDataCadastro) {
    setBackendErrors(null);

    const payload: CadastrarMensagemRequest = {
      titulo: data.titulo,
      conteudo: data.conteudo,
      direcionamento: {
        tipo: data.direcionamento_tipo,
        grupo_empresa_id:
          data.direcionamento_tipo === "grupo_empresa"
            ? data.grupo_empresa_id
            : undefined,
        usuario_id:
          data.direcionamento_tipo === "usuario" ? data.usuario_id : undefined,
      },
    };

    await mutateAsync(payload);
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
              title="Mensagens"
              description="Envie uma nova mensagem para um grupo de empresa ou usuário específico."
            />

            <AdminPermissionGuard permission="admin.mensagem.cadastrar">
              <MensagemFormCreate
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
