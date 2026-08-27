"use client";

import { use } from "react";

import { ArrowLeft } from "lucide-react";

import { AdminPermissionGuard } from "@/app/admin/_components/guard/AdminPermissionGuard";
import { AppSidebar } from "@/app/admin/_components/layouts/app-sidebar";
import { SiteHeader } from "@/app/admin/_components/layouts/site-header";

import { PageHeader } from "@/components/layouts/page-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

import { useChamado } from "@/domains/admin/chamado/hooks/useChamado";

import { ChamadoConversa } from "@/features/admin/chamado/components/ChamadoConversa";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: chamado, isLoading } = useChamado(id);

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
              title="Chamado"
              description="Acompanhe e responda a conversa com o cliente."
              actions={[
                {
                  label: "Voltar",
                  href: "/admin/chamados",
                  variant: "default",
                },
              ]}
            />

            <AdminPermissionGuard permission="admin.chamado.listar">
              {isLoading || !chamado ? (
                <Skeleton className="h-[500px] w-full" />
              ) : (
                <ChamadoConversa chamado={chamado} />
              )}
            </AdminPermissionGuard>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
