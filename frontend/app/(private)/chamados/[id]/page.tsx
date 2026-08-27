"use client";

import { use } from "react";

import { PrivatePermissionGuard } from "@/app/(private)/_components/guard/PrivatePermissionGuard";
import { AppSidebar } from "@/app/(private)/_components/layouts/app-sidebar";
import { PageHeader } from "@/app/(private)/_components/layouts/page-header";
import { SiteHeader } from "@/app/(private)/_components/layouts/site-header";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

import { useChamado } from "@/domains/private/chamado/hooks/useChamado";

import { ChamadoConversa } from "@/features/private/chamado/components/ChamadoConversa";

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
              description="Acompanhe a conversa com o suporte."
              actions={[
                {
                  label: "Voltar",
                  href: "/chamados",
                  variant: "default",
                },
              ]}
            />

            <PrivatePermissionGuard permission="private.chamado.listar">
              {isLoading || !chamado ? (
                <Skeleton className="h-[500px] w-full" />
              ) : (
                <ChamadoConversa chamado={chamado} />
              )}
            </PrivatePermissionGuard>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
