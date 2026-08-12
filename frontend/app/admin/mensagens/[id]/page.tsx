"use client";

import { useEffect } from "react";

import { useRouter, useParams } from "next/navigation";

import { AxiosError } from "axios";
import { toast } from "sonner";

import { ApiErrorResponse } from "@/types/errors";

import { AdminPermissionGuard } from "@/app/admin/_components/guard/AdminPermissionGuard";
import { AppSidebar } from "@/app/admin/_components/layouts/app-sidebar";
import { PageHeader } from "@/app/admin/_components/layouts/page-header";
import { SiteHeader } from "@/app/admin/_components/layouts/site-header";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { useMensagem } from "@/domains/admin/mensagem/hooks/useMensagem";

import { MensagemView } from "@/features/admin/mensagem/components/MensagemView";
import { MensagemViewSkeleton } from "@/features/admin/mensagem/components/MensagemViewSkeleton";

export default function Page() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data, isLoading, error } = useMensagem(id);

  useEffect(() => {
    if (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;

      toast.error(
        axiosError.response?.data?.errors.business ??
          "Não foi possível carregar os dados."
      );

      router.push("/admin/mensagens");
    }
  }, [error, router]);

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
              title="Mensagens"
              description="Detalhes da mensagem"
              actions={[
                {
                  label: "Voltar",
                  href: "/admin/mensagens",
                  icon: null,
                  variant: "default",
                },
              ]}
            />

            <AdminPermissionGuard permission="admin.mensagem.visualizar">
              {isLoading || !data ? (
                <MensagemViewSkeleton />
              ) : (
                <MensagemView mensagem={data} />
              )}
            </AdminPermissionGuard>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
