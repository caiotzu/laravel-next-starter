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

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { cadastrarBanner } from "@/domains/admin/banner/services/bannerService";
import { Banner } from "@/domains/admin/banner/types/banner.model";
import { CadastrarBannerRequest } from "@/domains/admin/banner/types/banner.requests";

import { BannerFormCreate } from "@/features/admin/banner/components/BannerFormCreate";
import { BannerFormData } from "@/features/admin/banner/schemas/banner.schema";

export default function Page() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [backendErrors, setBackendErrors] = useState<string[] | null>(null);

  const { mutateAsync, isPending } = useMutation<
    Banner,
    AxiosError<ApiErrorResponse>,
    { data: CadastrarBannerRequest; setError: UseFormSetError<BannerFormData> }
  >({
    mutationFn: ({ data }) => cadastrarBanner(data),
    onSuccess: () => {
      toast.success("Banner cadastrado com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      router.push("/admin/banners");
    },
    onError: (error, variables) => {
      const apiErrors = error.response?.data?.errors;

      if (!apiErrors) {
        setBackendErrors(["Erro ao cadastrar banner."]);
        return;
      }

      if ("business" in apiErrors && Array.isArray(apiErrors.business)) {
        setBackendErrors(apiErrors.business);
        return;
      }

      Object.entries(apiErrors).forEach(([field, messages]) => {
        if (!Array.isArray(messages)) return;

        variables.setError(field as keyof BannerFormData, {
          type: "server",
          message: messages[0],
        });
      });
    },
  });

  async function handleSubmit(
    data: CadastrarBannerRequest,
    setError: UseFormSetError<BannerFormData>
  ) {
    setBackendErrors(null);
    await mutateAsync({ data, setError });
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
              description="Cadastro de uma nova campanha de banner"
            />

            <AdminPermissionGuard permission="admin.banner.cadastrar">
              <BannerFormCreate
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
