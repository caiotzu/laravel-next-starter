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

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { concederAcessoSuporte } from "@/domains/private/acesso-suporte/services/acessoSuporteService";
import { AcessoSuporte } from "@/domains/private/acesso-suporte/types/acessoSuporte.model";

import { AcessoSuporteFormConceder } from "@/features/private/acesso-suporte/components/AcessoSuporteFormConceder";
import { AcessoSuporteFormDataConceder } from "@/features/private/acesso-suporte/schemas/acessoSuporte.schema";

export default function Page() {
  const router = useRouter();

  const [backendErrors, setBackendErrors] = useState<string[] | null>(null);

  const { mutate, isPending } = useMutation<
    AcessoSuporte,
    AxiosError<ApiErrorResponse>,
    {
      data: AcessoSuporteFormDataConceder;
      setError: UseFormSetError<AcessoSuporteFormDataConceder>;
    }
  >({
    mutationFn: ({ data }) => concederAcessoSuporte(data),
    onSuccess: () => {
      toast.success("Acesso de suporte concedido com sucesso!");
      router.push("/acesso-suporte");
    },
    onError: (error, variables) => {
      const apiErrors = error.response?.data?.errors;

      if (!apiErrors) {
        setBackendErrors(["Erro ao conceder o acesso de suporte."]);
        return;
      }

      if ("business" in apiErrors && Array.isArray(apiErrors.business)) {
        setBackendErrors(apiErrors.business);
        return;
      }

      Object.entries(apiErrors).forEach(([field, messages]) => {
        if (!Array.isArray(messages)) return;

        variables.setError(field as keyof AcessoSuporteFormDataConceder, {
          type: "server",
          message: messages[0],
        });
      });
    },
  });

  async function handleSubmit(
    data: AcessoSuporteFormDataConceder,
    setError: UseFormSetError<AcessoSuporteFormDataConceder>
  ) {
    setBackendErrors(null);
    mutate({ data, setError });
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
              title="Acesso de Suporte"
              description="Conceder novo acesso"
            />

            <PrivatePermissionGuard permission="private.acesso_suporte.cadastrar">
              <AcessoSuporteFormConceder
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
