"use client";

import { AppSidebar } from "@/app/admin/_components/layouts/app-sidebar";
import { SiteHeader } from "@/app/admin/_components/layouts/site-header";

import { PageHeader } from "@/components/layouts/page-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { HomeWelcomeCard } from "@/features/admin/home/components/HomeWelcomeCard";

export default function Page() {
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
          <div className="@container/main flex flex-col gap-6 py-6">
            <div className="px-4 lg:px-6">
              <PageHeader
                title="Home"
                description="Seu ponto de partida no painel administrativo."
              />
            </div>

            <div className="px-4 lg:px-6">
              <HomeWelcomeCard />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
