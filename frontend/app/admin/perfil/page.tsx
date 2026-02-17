"use client";

import { AppSidebar } from "@/app/admin/_components/layouts/app-sidebar";
import { SiteHeader } from "@/app/admin/_components/layouts/site-header";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { useUserAdmin } from "@/hooks/use-user-admin";

import { PerfilHeaderCard } from "@/features/admin/perfil/components/PerfilHeaderCard";
import { PerfilTabs } from "@/features/admin/perfil/components/PerfilTabs";

export default function Page() {
  const { data: userAdmin, isLoading } = useUserAdmin();

  if (isLoading) return <div>Carregando...</div>;
  if (!userAdmin) return <div>Usuário não encontrado</div>;

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />

        <div className="p-6 space-y-6">
          <PerfilHeaderCard user={userAdmin} />
          <PerfilTabs user={userAdmin} />
        </div>

      </SidebarInset>
    </SidebarProvider>
  );
}
