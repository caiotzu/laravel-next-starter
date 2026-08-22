"use client";

import { use, useState } from "react";

import { useRouter } from "next/navigation";

import { AxiosError } from "axios";
import { toast } from "sonner";

import { ApiErrorResponse } from "@/types/errors";

import { AdminPermissionGuard } from "@/app/admin/_components/guard/AdminPermissionGuard";
import { AppSidebar } from "@/app/admin/_components/layouts/app-sidebar";
import { SiteHeader } from "@/app/admin/_components/layouts/site-header";

import { PageHeader } from "@/components/layouts/page-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

import { useAtualizarRelease } from "@/domains/admin/release/hooks/useAtualizarRelease";
import { useRelease } from "@/domains/admin/release/hooks/useRelease";

import { ReleaseForm } from "@/features/admin/release/components/ReleaseForm";
import { ReleaseFormData } from "@/features/admin/release/schemas/release.schema";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [backendErrors, setBackendErrors] = useState<string[] | null>(null);

  const { data: release, isLoading } = useRelease(id);
  const { mutateAsync, isPending } = useAtualizarRelease();

  async function handleSubmit(data: ReleaseFormData) {
    setBackendErrors(null);

    try {
      await mutateAsync({ id, payload: data });
      toast.success("Release atualizada com sucesso.");
      router.push("/admin/releases/gerenciar");
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const apiErrors = axiosError.response?.data?.errors;

      setBackendErrors(apiErrors?.business ?? ["Não foi possível atualizar a release."]);
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
              title="Editar release"
              description="As alterações não afetam o status de publicação."
            />

            <AdminPermissionGuard permission="admin.release.editar">
              {isLoading || !release ? (
                <Skeleton className="h-96 w-full" />
              ) : (
                <ReleaseForm
                  tituloCard="Editar release"
                  labelSubmit="Salvar alterações"
                  cancelarHref="/admin/releases/gerenciar"
                  defaultValues={{
                    contexto: release.contexto ?? "private",
                    titulo: release.titulo,
                    conteudo: release.conteudo,
                    tipo: release.tipo,
                    versao: release.versao,
                  }}
                  onSubmit={handleSubmit}
                  isLoading={isPending}
                  backendErrors={backendErrors}
                  clearBackendErrors={() => setBackendErrors(null)}
                />
              )}
            </AdminPermissionGuard>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
