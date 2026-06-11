"use client";

import { useEffect } from "react";

import { useRouter, useParams } from "next/navigation";

import { toast } from "sonner";

import { AdminPermissionGuard } from "@/app/admin/_components/guard/AdminPermissionGuard";
import { AppSidebar } from "@/app/admin/_components/layouts/app-sidebar";
import { SiteHeader } from "@/app/admin/_components/layouts/site-header";

import { PageHeader } from "@/components/layouts/page-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

import { useUsuario } from "@/domains/admin/usuario/hooks/useUsuario";

import UsuarioView from "@/features/admin/usuario/components/UsuarioView";
import { UsuarioViewSkeleton } from "@/features/admin/usuario/components/UsuarioViewSkeleton";


export default function Page() {
	const router = useRouter();
	const params = useParams();
	const id = params.id as string;

	const { data: usuario, isLoading, error} = useUsuario(id);

	useEffect(() => {
    if (!isLoading && (error || !usuario)) {
      toast.error("Usuário não encontrado");

      router.replace("/admin/usuarios");
    }
  }, [isLoading, error, usuario, router]);

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
              title="Usuários"
              description="Detalhes do usuário"
              actions={[
                {
                  label: "Voltar",
                  href: "/admin/usuarios",
                  icon: null,
                  variant: "default"
                },
              ]}
            />

            <AdminPermissionGuard permission="admin.usuario.visualizar">
							{isLoading || !usuario ? (
								<UsuarioViewSkeleton />
							) : (
								<UsuarioView 
									usuario={usuario}
								/>
							)}
            </AdminPermissionGuard>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
	);
}