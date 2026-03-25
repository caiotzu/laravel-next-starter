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

import { useEmpresa } from "@/domains/admin/empresa/hooks/useEmpresa";
import { editarEmpresa } from "@/domains/admin/empresa/services/empresaService";
import { EditarEmpresaRequest } from "@/domains/admin/empresa/types/empresa.requests";
import { EditarEmpresaResponse } from "@/domains/admin/empresa/types/empresa.responses";
import { maskCEP, maskCNPJ, maskPhone, onlyDigits } from "@/lib/utils";

import { EmpresaFormEdicao } from "@/features/admin/empresa/components/EmpresaFormEdicao";
import { EmpresaFormEdicaoSkeleton } from "@/features/admin/empresa/components/EmpresaFormEdicaoSkeleton";
import {
  EmpresaContatoFormData,
  EmpresaEnderecoFormData,
  EmpresaFormDataEdicao,
} from "@/features/admin/empresa/schemas/empresa.schema";

import { AdminPermissionGuard } from "../../_components/guard/AdminPermissionGuard";

export default function Page() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();

  const [backendErrors, setBackendErrors] = useState<string[] | null>(null);
  const [formSetError, setFormSetError] = useState<UseFormSetError<EmpresaFormDataEdicao> | null>(null);

  const { data, isLoading, error } = useEmpresa(id);

  useEffect(() => {
    if (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      toast.error(axiosError.response?.data?.errors.business || "Empresa nao encontrada.");
      router.push("/admin/empresas");
    }
  }, [error, router]);

  const defaultValues = useMemo(() => {
    if (!data) return undefined;
    return {
      grupo_empresa_id: data.grupo_empresa.id,
      matriz_id: data.matriz_id ?? "",
      cnpj: maskCNPJ(data.cnpj),
      nome_fantasia: data.nome_fantasia,
      razao_social: data.razao_social,
      inscricao_estadual: data.inscricao_estadual ?? "",
      inscricao_municipal: data.inscricao_municipal ?? "",
      uf: data.uf as EmpresaFormDataEdicao["uf"],
      ativo: data.ativo,
      enderecos: data.enderecos.map((endereco) => ({
        tipo: endereco.tipo as EmpresaEnderecoFormData["tipo"],
        municipio_id: endereco.municipio_id,
        principal: endereco.principal,
        ativo: endereco.ativo,
        cep: maskCEP(endereco.cep),
        logradouro: endereco.logradouro,
        numero: endereco.numero,
        bairro: endereco.bairro,
        complemento: endereco.complemento ?? "",
      })),
      contatos: data.contatos.map((contato) => ({
        tipo: contato.tipo as EmpresaContatoFormData["tipo"],
        valor: contato.tipo === "T" ? maskPhone(contato.valor) : contato.valor,
        principal: contato.principal,
        ativo: contato.ativo,
      })),
    };
  }, [data]);

  const { mutateAsync, isPending } = useMutation<
    EditarEmpresaResponse,
    AxiosError<ApiErrorResponse>,
    EditarEmpresaRequest
  >({
    mutationFn: (formData) => editarEmpresa(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empresa", id] });
      toast.success("Empresa atualizada com sucesso!");
      router.push("/admin/empresas");
    },
    onError: (error) => {
      const apiErrors = error.response?.data?.errors;

      if (!apiErrors) {
        setBackendErrors(["Erro ao atualizar empresa."]);
        return;
      }

      if (apiErrors.business) {
        setBackendErrors(apiErrors.business);
      }

      if (formSetError) {
        Object.entries(apiErrors).forEach(([field, messages]) => {
          if (!messages || field === "business") return;

          formSetError(field as keyof EmpresaFormDataEdicao, {
            type: "server",
            message: messages[0],
          });
        });
      }
    },
  });

  async function handleSubmit(data: EmpresaFormDataEdicao) {
    setBackendErrors(null);
    const payload: EditarEmpresaRequest = {
      matriz_id: data.matriz_id,
      cnpj: onlyDigits(data.cnpj),
      nome_fantasia: data.nome_fantasia,
      razao_social: data.razao_social,
      inscricao_estadual: data.inscricao_estadual || undefined,
      inscricao_municipal: data.inscricao_municipal || undefined,
      uf: data.uf,
      ativo: data.ativo,
    };

    await mutateAsync(payload);
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
              <EmpresaFormEdicaoSkeleton />
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
              title="Empresas"
              description="Gerencie as empresas cadastradas."
            />

            <AdminPermissionGuard permission="admin.empresa.atualizar">
              <EmpresaFormEdicao
                defaultValues={defaultValues}
                grupoEmpresaNome={data.grupo_empresa.nome}
                matrizEmpresaNome={data.matriz?.nome_fantasia ?? ""}
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
