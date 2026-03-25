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

import { PageHeader } from "@/components/layouts/page-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

import { cadastrarEmpresa } from "@/domains/admin/empresa/services/empresaService";
import { CadastrarEmpresaRequest } from "@/domains/admin/empresa/types/empresa.requests";
import { CadastrarEmpresaResponse } from "@/domains/admin/empresa/types/empresa.responses";
import { onlyDigits } from "@/lib/utils";

import { EmpresaFormCadastro } from "@/features/admin/empresa/components/EmpresaFormCadastro";
import { EmpresaFormDataCadastro } from "@/features/admin/empresa/schemas/empresa.schema";

import { AdminPermissionGuard } from "../../_components/guard/AdminPermissionGuard";

export default function Page() {
  const router = useRouter();
  const [backendErrors, setBackendErrors] = useState<string[] | null>(null);
  const [formError, setFormError] = useState<UseFormSetError<EmpresaFormDataCadastro> | null>(null);

  const { mutateAsync, isPending } = useMutation<
    CadastrarEmpresaResponse,
    AxiosError<ApiErrorResponse>,
    CadastrarEmpresaRequest
  >({
    mutationFn: cadastrarEmpresa,
    onSuccess: () => {
      toast.success("Empresa cadastrada com sucesso!");
      router.push("/admin/empresas");
    },
    onError: (error) => {
      const apiErrors = error.response?.data?.errors;

      if (!apiErrors) {
        setBackendErrors(["Erro ao cadastrar empresa."]);
        return;
      }

      if (apiErrors.business) {
        setBackendErrors(apiErrors.business);
        return;
      }

      if (formError) {
        Object.entries(apiErrors).forEach(([field, messages]) => {
          if (!messages || field === "business") return;

          formError(field as keyof EmpresaFormDataCadastro, {
            type: "server",
            message: messages[0],
          });
        });
      }
    },
  });

  async function handleSubmit(data: EmpresaFormDataCadastro) {
    setBackendErrors(null);
    const payload: CadastrarEmpresaRequest = {
      grupo_empresa_id: data.grupo_empresa_id,
      matriz_id: data.matriz_id || undefined,
      cnpj: onlyDigits(data.cnpj),
      nome_fantasia: data.nome_fantasia,
      razao_social: data.razao_social,
      inscricao_estadual: data.inscricao_estadual || undefined,
      inscricao_municipal: data.inscricao_municipal || undefined,
      uf: data.uf,
      enderecos: data.enderecos.map((endereco) => ({
        ...endereco,
        cep: onlyDigits(endereco.cep),
        complemento: endereco.complemento || undefined,
      })),
      contatos: data.contatos.map((contato) => ({
        ...contato,
        valor: contato.tipo === "T" ? onlyDigits(contato.valor) : contato.valor,
      })),
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
              title="Empresas"
              description="Gerencie as empresas cadastradas."
            />

            <AdminPermissionGuard permission="admin.empresa.cadastrar">
              <EmpresaFormCadastro
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
