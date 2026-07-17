"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import { ApiErrorResponse } from "@/types/errors";

import { AdminPermissionGuard } from "@/app/admin/_components/guard/AdminPermissionGuard";
import { AppSidebar } from "@/app/admin/_components/layouts/app-sidebar";
import { SiteHeader } from "@/app/admin/_components/layouts/site-header";

import { PageHeader } from "@/components/layouts/page-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

import { useGrupos } from "@/domains/admin/grupo/hooks/useGrupos";
import { cadastrarUsuario } from "@/domains/admin/usuario/services/usuarioService";
import { Usuario } from "@/domains/admin/usuario/types/usuario.model";

import { UsuarioFormCreate } from "@/features/admin/usuario/components/UsuarioFormCreate";
import { UsuarioFormCreateSkeleton } from "@/features/admin/usuario/components/UsuarioFormCreateSkeleton";
import { UsuarioFormDataCadastro } from "@/features/admin/usuario/schemas/usuario.schema";

export default function Page() {
  const router = useRouter();

  const [backendErrors, setBackendErrors] = useState<string[] | null>(null);

  const { data: grupos, isLoading: isLoadingGrupos, error: errorGrupos } = useGrupos();
  useEffect(() => {
    if (errorGrupos) {
      const axiosError = errorGrupos as AxiosError<ApiErrorResponse>;

      toast.error(
        axiosError.response?.data?.errors.business ?? 
        "Não foi possível carregar os grupos para o cadastro do usuário."
      );
      
      router.push("/admin/usuarios");
    }
  }, [errorGrupos, router]);

  const { mutate, isPending } = useMutation<
    Usuario,
    AxiosError<ApiErrorResponse>,
    {
      data: UsuarioFormDataCadastro;
      setError: UseFormSetError<UsuarioFormDataCadastro>;
    }
  >({
    mutationFn: ({ data }) => cadastrarUsuario(data),
    onSuccess: () => {
      toast.success("Usuário cadastrado com sucesso!");
      router.push("/admin/usuarios");
    },
    onError: (error, variables) => {
      const apiErrors = error.response?.data?.errors;

      if (!apiErrors) {
        setBackendErrors(["Erro ao cadastrar o usuário."]);
        return;
      }

      if ("business" in apiErrors && Array.isArray(apiErrors.business)) {
        setBackendErrors(apiErrors.business);
        return;
      }

      Object.entries(apiErrors).forEach(([field, messages]) => {
        if (!Array.isArray(messages)) return;

        variables.setError(field as keyof UsuarioFormDataCadastro, {
          type: "server",
          message: messages[0],
        });
      });
    },
  });

  async function handleSubmit(
    data: UsuarioFormDataCadastro,
    setError: UseFormSetError<UsuarioFormDataCadastro>
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
              description="Novo usuário"
            />

            <AdminPermissionGuard permission="admin.usuario.cadastrar">
							{isLoadingGrupos ? (
								<UsuarioFormCreateSkeleton />
							) : (
								<UsuarioFormCreate
									onSubmit={handleSubmit}
									isLoading={isPending}
									backendErrors={backendErrors}
									clearBackendErrors={() => setBackendErrors(null)}
									grupos={grupos?.data ?? []}
									isLoadingGrupos={isLoadingGrupos}
								/>
							)}
            </AdminPermissionGuard>

          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
