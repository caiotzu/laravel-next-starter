"use client";

import { useEffect } from "react";

import { useRouter, useParams } from "next/navigation";

import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

import { ApiErrorResponse } from "@/types/errors";

import { AdminPermissionGuard } from "@/app/admin/_components/guard/AdminPermissionGuard";
import { AppSidebar } from "@/app/admin/_components/layouts/app-sidebar";
import { SiteHeader } from "@/app/admin/_components/layouts/site-header";

import { PageHeader } from "@/components/layouts/page-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { useEmpresa } from "@/domains/admin/empresa/hooks/useEmpresa";
import { editarEmpresa } from "@/domains/admin/empresa/services/empresaService";

import { EmpresaFormEdit } from "@/features/admin/empresa/components/EmpresaFormEdit";
import { EmpresaFormEditSkeleton } from "@/features/admin/empresa/components/EmpresaFormEditSkeleton";
import { EmpresaFormDataEdicao } from "@/features/admin/empresa/schemas/empresa.schema";

export default function Page() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();

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

	const atualizarEmpresaMutation = useMutation({
		mutationFn: (data: EmpresaFormDataEdicao) =>
		editarEmpresa(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["empresa", id],
			});

			toast.success("Empresa atualizado com sucesso");
		},
	});

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

						<AdminPermissionGuard 
							permissions={[
                "admin.empresa.atualizar",

								"admin.empresa.contato.atualizar",
								"admin.empresa.contato.cadastrar",
								"admin.empresa.contato.excluir",
								"admin.empresa.contato.listar",
								"admin.empresa.contato.visualizar",

								"admin.empresa.endereco.atualizar",
								"admin.empresa.endereco.cadastrar",
								"admin.empresa.endereco.excluir",
								"admin.empresa.endereco.listar",
								"admin.empresa.endereco.visualizar",
              ]} 
						>
							{isLoading || !data ? (
                <EmpresaFormEditSkeleton />
              ) : (
								<EmpresaFormEdit empresa={data}/>
							)}
						</AdminPermissionGuard>
					</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}