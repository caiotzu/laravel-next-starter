"use client";

import { useEffect } from "react";

import { useRouter, useParams } from "next/navigation";

import { AxiosError } from "axios";
import { toast } from "sonner";

import { ApiErrorResponse } from "@/types/errors";

import { AdminPermissionGuard } from "@/app/admin/_components/guard/AdminPermissionGuard";
import { AppSidebar } from "@/app/admin/_components/layouts/app-sidebar";
import { SiteHeader } from "@/app/admin/_components/layouts/site-header";

import { PageHeader } from "@/components/layouts/page-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { useEmpresa } from "@/domains/admin/empresa/hooks/useEmpresa";

import { EmpresaFormEditSkeleton } from "@/features/admin/empresa/components/EmpresaFormEditSkeleton";
import { EmpresaFormView } from "@/features/admin/empresa/components/EmpresaFormView";

export default function Page() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data, isLoading, error } = useEmpresa(id);
  useEffect(() => {
    if (!error) return;

    const axiosError = error as AxiosError<ApiErrorResponse>;

    toast.error(
      axiosError.response?.data?.errors.business ??
      "Não foi possível carregar os dados."
    );

    router.push("/admin/empresas");
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
							title="Empresas"
							description="Gerencie as empresas cadastradas."
							actions={[
								{
									label: "Voltar",
									href: "/admin/empresas",
									icon: null,
									variant: "default",
								},
							]}
						/>

						<AdminPermissionGuard permission="admin.empresa.visualizar" >
							{isLoading || !data ? (
                <EmpresaFormEditSkeleton />
              ) : (
								<EmpresaFormView empresa={data}/>
							)}
						</AdminPermissionGuard>
					</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}