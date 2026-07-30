"use client";

import { useEffect } from "react";

import { useRouter, useParams } from "next/navigation";

import { toast } from "sonner";

import { PrivatePermissionGuard } from "@/app/(private)/_components/guard/PrivatePermissionGuard";
import { AppSidebar } from "@/app/(private)/_components/layouts/app-sidebar";
import { SiteHeader } from "@/app/(private)/_components/layouts/site-header";

import { PageHeader } from "@/components/layouts/page-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

import { useUsuario } from "@/domains/private/usuario/hooks/useUsuario";

import UsuarioView from "@/features/private/usuario/components/UsuarioView";
import { UsuarioViewSkeleton } from "@/features/private/usuario/components/UsuarioViewSkeleton";


export default function Page() {
	const router = useRouter();
	const params = useParams();
	const id = params.id as string;

	const { data: usuario, isLoading, error} = useUsuario(id);

	useEffect(() => {
    if (!isLoading && (error || !usuario)) {
      toast.error("Usuário não encontrado");

      router.replace("/usuarios");
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
                  href: "/usuarios",
                  icon: null,
                  variant: "default"
                },
              ]}
            />

            <PrivatePermissionGuard permission="private.usuario.visualizar">
							{isLoading || !usuario ? (
								<UsuarioViewSkeleton />
							) : (
								<UsuarioView 
									usuario={usuario}
								/>
							)}
            </PrivatePermissionGuard>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
	);
}