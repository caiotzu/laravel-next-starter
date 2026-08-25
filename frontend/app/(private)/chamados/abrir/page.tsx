"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { AxiosError } from "axios";
import { toast } from "sonner";

import { ApiErrorResponse } from "@/types/errors";

import { PrivatePermissionGuard } from "@/app/(private)/_components/guard/PrivatePermissionGuard";
import { AppSidebar } from "@/app/(private)/_components/layouts/app-sidebar";
import { PageHeader } from "@/app/(private)/_components/layouts/page-header";
import { SiteHeader } from "@/app/(private)/_components/layouts/site-header";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { useAbrirChamado } from "@/domains/private/chamado/hooks/useAbrirChamado";
import { AbrirChamadoRequest } from "@/domains/private/chamado/types/chamado.requests";

import { ChamadoAbrirForm } from "@/features/private/chamado/components/ChamadoAbrirForm";

export default function Page() {
  const router = useRouter();
  const [backendErrors, setBackendErrors] = useState<string[] | null>(null);

  const { mutateAsync, isPending } = useAbrirChamado();

  async function handleSubmit(data: AbrirChamadoRequest) {
    setBackendErrors(null);

    try {
      const chamado = await mutateAsync(data);
      toast.success(`Chamado ${chamado.ticket} aberto com sucesso.`);
      router.push(`/chamados/${chamado.id}`);
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const apiErrors = axiosError.response?.data?.errors;

      setBackendErrors(apiErrors?.business ?? ["Não foi possível abrir o chamado."]);
    }
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
              title="Abrir chamado"
              description="Conte para a gente o que você precisa — nossa equipe vai te responder por aqui."
            />

            <PrivatePermissionGuard permission="private.chamado.abrir">
              <ChamadoAbrirForm
                onSubmit={handleSubmit}
                isLoading={isPending}
                backendErrors={backendErrors}
                clearBackendErrors={() => setBackendErrors(null)}
                cancelarHref="/chamados"
              />
            </PrivatePermissionGuard>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
