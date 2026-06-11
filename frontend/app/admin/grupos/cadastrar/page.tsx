"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { AdminPermissionGuard } from "@/app/admin/_components/guard/AdminPermissionGuard";
import { AppSidebar } from "@/app/admin/_components/layouts/app-sidebar";
import { PageHeader } from "@/app/admin/_components/layouts/page-header";
import { SiteHeader } from "@/app/admin/_components/layouts/site-header";

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

import { GruposTable } from "@/features/admin/grupo/components/GruposTable";

export default function Page() {
  const router = useRouter();
  const [backendErrors, setBackendErrors] = useState<string[] | null>(null);

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
              title="Grupos"
              description="Novo grupo"
            />

            <AdminPermissionGuard permission="admin.grupo.cadastrar">
              <h1>Opa</h1>
              {/* <GruposTable
                data={data?.data ?? []}
              /> */}
            </AdminPermissionGuard>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}