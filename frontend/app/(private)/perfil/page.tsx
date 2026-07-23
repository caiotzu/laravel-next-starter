"use client";

import { AppSidebar } from "@/app/(private)/_components/layouts/app-sidebar";
import { SiteHeader } from "@/app/(private)/_components/layouts/site-header";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { useUserPrivate } from "@/hooks/use-user-private";

import { PerfilHeaderCard } from "@/features/private/perfil/components/PerfilHeaderCard";
import { PerfilTabs } from "@/features/private/perfil/components/PerfilTabs";

export default function Page() {
  const { data: userPrivate, isLoading } = useUserPrivate();

  if (isLoading) return <div>Carregando...</div>;
  if (!userPrivate) return <div>Usuário não encontrado</div>;

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />

        <div className="p-6 space-y-6">
          <PerfilHeaderCard user={userPrivate} />
          <PerfilTabs user={userPrivate} />
        </div>

      </SidebarInset>
    </SidebarProvider>
  );
}
