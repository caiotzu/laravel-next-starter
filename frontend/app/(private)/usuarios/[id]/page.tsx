"use client";

import { useEffect, useState } from "react";

import { useRouter, useParams } from "next/navigation";

import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import { ApiErrorResponse } from "@/types/errors";

import { PrivatePermissionGuard } from "@/app/(private)/_components/guard/PrivatePermissionGuard";
import { AppSidebar } from "@/app/(private)/_components/layouts/app-sidebar";
import { SiteHeader } from "@/app/(private)/_components/layouts/site-header";

import { PageHeader } from "@/components/layouts/page-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

import { useGrupos } from "@/domains/private/grupo/hooks/useGrupos";
import { useUsuario } from "@/domains/private/usuario/hooks/useUsuario";
import { editarUsuario } from "@/domains/private/usuario/services/usuarioService";


import { UsuarioFormEdit } from "@/features/private/usuario/components/UsuarioFormEdit";
import { UsuarioFormEditSkeleton } from "@/features/private/usuario/components/UsuarioFormEditSkeleton";
import { UsuarioFormDataEdicao } from "@/features/private/usuario/schemas/usuario.schema";

import { Usuario } from "@/domains/private/usuario/types/usuario.model";


export default function Page() {
	const router = useRouter();
	const params = useParams();
  const id = params.id as string;

	const [backendErrors, setBackendErrors] = useState<string[] | null>(null);
    
	const { data: usuario, isLoading, error} = useUsuario(id);
	const { data: grupos, isLoading: isLoadingGrupos, error:errorGrupos  } = useGrupos();
 
  useEffect(() => {
    const currentError = error || errorGrupos;
    if (!currentError) return;

    const axiosError = currentError as AxiosError<ApiErrorResponse>;

    toast.error(
      axiosError.response?.data?.errors.business ??
      "Não foi possível carregar os dados."
    );

    router.push("/usuarios");
  }, [error, errorGrupos, router]);
	
	const { mutate, isPending } = useMutation<
		Usuario,
		AxiosError<ApiErrorResponse>,
		{
			data: UsuarioFormDataEdicao,
			setError: UseFormSetError<UsuarioFormDataEdicao>
		}
	>({
		mutationFn: ({ data }) => editarUsuario(id, data),
		onSuccess: () => {
			toast.success("Usuário atualizado com sucesso!");
      router.push("/usuarios");
		},
		onError: (error, variables) => {
      const apiErrors = error.response?.data?.errors;

      if (!apiErrors) {
        setBackendErrors(["Erro ao editar o usuário."]);
        return;
      }

      if ("business" in apiErrors && Array.isArray(apiErrors.business)) {
        setBackendErrors(apiErrors.business);
        return;
      }

      Object.entries(apiErrors).forEach(([field, messages]) => {
        if (!Array.isArray(messages)) return;

        variables.setError(field as keyof UsuarioFormDataEdicao, {
          type: "server",
          message: messages[0],
        });
      });
    },
	});

	async function handleSubmit(
    data: UsuarioFormDataEdicao,
    setError: UseFormSetError<UsuarioFormDataEdicao>
  ) {
    setBackendErrors(null);

    mutate({
      data,
      setError,
    });
  }

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
              title="Usuarios"
              description="Edição de usuário"
            />

            <PrivatePermissionGuard permission="private.usuario.atualizar">
							{!usuario || isLoading ? (
								<UsuarioFormEditSkeleton />
							) : (
								<UsuarioFormEdit
									onSubmit={handleSubmit}
									isLoading={isPending}
									backendErrors={backendErrors}
									clearBackendErrors={() => setBackendErrors(null)}
									usuario={usuario}
									grupos={grupos?.data ?? []}
									isLoadingGrupos={isLoadingGrupos}
								/>
							)}
            </PrivatePermissionGuard>

          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
	);
}