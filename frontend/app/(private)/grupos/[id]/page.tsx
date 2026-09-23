"use client";

import { useEffect, useState } from "react";

import { useRouter, useParams } from "next/navigation";

import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import { ApiErrorResponse } from "@/types/errors";

import { PrivatePermissionGuard } from "@/app/(private)/_components/guard/PrivatePermissionGuard";
import { AppSidebar } from "@/app/(private)/_components/layouts/app-sidebar";
import { SiteHeader } from "@/app/(private)/_components/layouts/site-header";

import { PageHeader } from "@/components/layouts/page-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { useGrupo } from "@/domains/private/grupo/hooks/useGrupo";
import { editarGrupo, sincronizarPermissoesGrupo } from "@/domains/private/grupo/services/grupoService";
import { Grupo } from "@/domains/private/grupo/types/grupo.model";
import { usePermissoes } from "@/domains/private/permissao/hooks/usePermissoes";

import { GrupoFormEdit } from "@/features/private/grupo/components/GrupoFormEdit";
import { GrupoFormEditSkeleton } from "@/features/private/grupo/components/GrupoFormEditSkeleton";
import { GrupoFormDataEdicao } from "@/features/private/grupo/schemas/grupo.schema";

export default function Page() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();

  const [backendErrors, setBackendErrors] = useState<string[] | null>(null);

  const { data, isLoading, error } = useGrupo(id);
  useEffect(() => {
    if (!error) return;

    const axiosError = error as AxiosError<ApiErrorResponse>;

    toast.error(
      axiosError.response?.data?.errors.business ??
      "Não foi possível carregar os dados."
    );

    router.push("/grupos");
  }, [error, router]);

  const { data: permissoes, isLoading: isLoadingPermissoes, error: errorPermissoes } = usePermissoes();
  useEffect(() => {
    if (!errorPermissoes) return;

    const axiosError = errorPermissoes as AxiosError<ApiErrorResponse>;

    toast.error(
      axiosError.response?.data?.errors.business ??
      "Não foi possível carregar as permissões."
    );

    router.push("/grupos");
  }, [errorPermissoes, router]);

	const atualizarGrupoMutation = useMutation<
		Grupo,
		AxiosError<ApiErrorResponse>,
		{
			data: GrupoFormDataEdicao;
			setError: UseFormSetError<GrupoFormDataEdicao>;
		}
	>({
		mutationFn: ({ data }) => editarGrupo(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["grupo", id],
			});

			setBackendErrors(null);
			toast.success("Grupo atualizado com sucesso");
		},
		onError: (error, variables) => {
			const apiErrors = error.response?.data?.errors;

			if (!apiErrors) {
				setBackendErrors(["Erro ao atualizar o grupo."]);
				return;
			}

			if ("business" in apiErrors && Array.isArray(apiErrors.business)) {
				setBackendErrors(apiErrors.business);
				return;
			}

			Object.entries(apiErrors).forEach(([field, messages]) => {
				if (!Array.isArray(messages)) return;

				variables.setError(field as keyof GrupoFormDataEdicao, {
					type: "server",
					message: messages[0],
				});
			});
		},
	});

	const sincronizarPermissoesMutation = useMutation<
		Grupo,
		AxiosError<ApiErrorResponse>,
		string[]
	>({
		mutationFn: (permissoes: string[]) => sincronizarPermissoesGrupo(id, {permissoes}),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["grupo", id],
			});

			setBackendErrors(null);
			toast.success("Permissões atualizadas com sucesso");
		},
		onError: (error) => {
			const apiErrors = error.response?.data?.errors;

			if (!apiErrors) {
				setBackendErrors(["Erro ao atualizar as permissões do grupo."]);
				return;
			}

			if ("business" in apiErrors && Array.isArray(apiErrors.business)) {
				setBackendErrors(apiErrors.business);
				return;
			}

			// Sem formulário para vincular erro por campo (é uma lista de
			// checkboxes) — mostra todas as mensagens de validação no alerta.
			setBackendErrors(
				Object.values(apiErrors)
					.filter((messages): messages is string[] => Array.isArray(messages))
					.flat()
			);
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
              title="Grupos"
              description="Edição do grupo"
              actions={[
                {
                  label: "Voltar",
                  href: "/grupos",
                  icon: null,
                  variant: "default"
                },
              ]}
            />
            
            <PrivatePermissionGuard 
              // permission="private.grupo.atualizar"
              permissions={[
                "private.grupo.atualizar",
                "private.grupo.sincronizar_permissao",
              ]} 
            >
              {isLoading || !data || isLoadingPermissoes || !permissoes ? (
                <GrupoFormEditSkeleton />
              ) : (
								<GrupoFormEdit
									grupo={data}
									permissoes={permissoes.data}
									backendErrors={backendErrors}
									clearBackendErrors={() => setBackendErrors(null)}
									onSubmitGrupo={async (data, setError) => {
										setBackendErrors(null);
										try {
											await atualizarGrupoMutation.mutateAsync({ data, setError });
										} catch {
											// Erro já tratado e exibido em onError (backendErrors/setError acima).
										}
									}}
									onSubmitPermissoes={async (permissoes) => {
										setBackendErrors(null);
										try {
											await sincronizarPermissoesMutation.mutateAsync(permissoes);
										} catch {
											// Erro já tratado e exibido em onError (backendErrors acima).
										}
									}}
									isLoadingGrupo={atualizarGrupoMutation.isPending}
									isLoadingPermissoes={sincronizarPermissoesMutation.isPending}
								/>
              )}
            </PrivatePermissionGuard>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
