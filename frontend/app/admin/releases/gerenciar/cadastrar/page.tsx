"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { AxiosError } from "axios";
import { toast } from "sonner";

import { ApiErrorResponse } from "@/types/errors";

import { AdminPermissionGuard } from "@/app/admin/_components/guard/AdminPermissionGuard";
import { AppSidebar } from "@/app/admin/_components/layouts/app-sidebar";
import { SiteHeader } from "@/app/admin/_components/layouts/site-header";

import { PageHeader } from "@/components/layouts/page-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { useCadastrarRelease } from "@/domains/admin/release/hooks/useCadastrarRelease";

import { ReleaseForm } from "@/features/admin/release/components/ReleaseForm";
import { ReleaseFormData } from "@/features/admin/release/schemas/release.schema";

export default function Page() {
  const router = useRouter();
  const [backendErrors, setBackendErrors] = useState<string[] | null>(null);

  const { mutateAsync, isPending } = useCadastrarRelease();

  async function handleSubmit(data: ReleaseFormData) {
    setBackendErrors(null);

    try {
      await mutateAsync(data);
      toast.success("Release criada como rascunho.");
      router.push("/admin/releases/gerenciar");
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const apiErrors = axiosError.response?.data?.errors;

      setBackendErrors(apiErrors?.business ?? ["Não foi possível criar a release."]);
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
              title="Nova release"
              description="A release é criada como rascunho — publique quando estiver pronta."
            />

            <AdminPermissionGuard permission="admin.release.cadastrar">
              <ReleaseForm
                tituloCard="Cadastrar release"
                labelSubmit="Cadastrar release"
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
