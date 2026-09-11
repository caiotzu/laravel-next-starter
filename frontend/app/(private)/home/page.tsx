"use client";

import { AppSidebar } from "@/app/(private)/_components/layouts/app-sidebar";
import { PageHeader } from "@/app/(private)/_components/layouts/page-header";
import { SiteHeader } from "@/app/(private)/_components/layouts/site-header";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { HomeWelcomeCard } from "@/features/private/home/components/HomeWelcomeCard";

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
                description="Seu ponto de partida na sua área."
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
