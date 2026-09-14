"use client";

import { useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import { ApiErrorResponse } from "@/types/errors";

import { AdminPermissionGuard } from "@/app/admin/_components/guard/AdminPermissionGuard";
import { AppSidebar } from "@/app/admin/_components/layouts/app-sidebar";
import { SiteHeader } from "@/app/admin/_components/layouts/site-header";

import { PageHeader } from "@/components/layouts/page-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { useBanner } from "@/domains/admin/banner/hooks/useBanner";
import { atualizarBanner } from "@/domains/admin/banner/services/bannerService";
import { Banner } from "@/domains/admin/banner/types/banner.model";
import { AtualizarBannerRequest } from "@/domains/admin/banner/types/banner.requests";

import { BannerFormEdit } from "@/features/admin/banner/components/BannerFormEdit";
import { BannerFormEditSkeleton } from "@/features/admin/banner/components/BannerFormEditSkeleton";
import { BannerFormData } from "@/features/admin/banner/schemas/banner.schema";
import { mapBannerApiErrors } from "@/features/admin/banner/utils/mapBannerApiErrors";

export default function Page() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();

  const [backendErrors, setBackendErrors] = useState<string[] | null>(null);

  const { data, isLoading, error } = useBanner(id);

  useEffect(() => {
    if (!error) return;

    const axiosError = error as AxiosError<ApiErrorResponse>;

    toast.error(
      axiosError.response?.data?.errors.business ?? "Não foi possível carregar os dados."
    );

    router.push("/admin/banners");
  }, [error, router]);

  const { mutate, isPending } = useMutation<
    Banner,
    AxiosError<ApiErrorResponse>,
    { data: AtualizarBannerRequest; setError: UseFormSetError<BannerFormData> }
  >({
    mutationFn: ({ data }) => atualizarBanner({ id, dto: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banner", id] });
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      toast.success("Banner atualizado com sucesso!");
      router.push("/admin/banners");
    },
    onError: (error, variables) => {
      const apiErrors = error.response?.data?.errors;

      if (!apiErrors) {
        setBackendErrors(["Erro ao editar o banner."]);
        return;
      }

      if ("business" in apiErrors && Array.isArray(apiErrors.business)) {
        setBackendErrors(apiErrors.business);
        return;
      }

      const mensagensNaoMapeadas = mapBannerApiErrors(apiErrors, variables.setError);

      if (mensagensNaoMapeadas.length > 0) {
        setBackendErrors(mensagensNaoMapeadas);
      }
    },
  });

  async function handleSubmit(
    data: AtualizarBannerRequest,
    setError: UseFormSetError<BannerFormData>
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
              title="Banners"
              description="Edição de campanha de banner"
              actions={[
                {
                  label: "Voltar",
                  href: "/admin/banners",
                  variant: "default",
                },
              ]}
            />

            <AdminPermissionGuard permission="admin.banner.atualizar">
              {isLoading || !data ? (
                <BannerFormEditSkeleton />
              ) : (
                <BannerFormEdit
                  banner={data}
                  onSubmit={handleSubmit}
                  isLoading={isPending || isLoading}
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
