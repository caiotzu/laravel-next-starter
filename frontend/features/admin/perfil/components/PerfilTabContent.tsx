"use client";

import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ApiErrorResponse } from "@/types/errors";
import { Usuario } from "@/types/usuario.model";

import { AppAlert } from "@/components/feedback/AppAlert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useAtualizarPerfil } from "@/domain/admin/perfil/hooks/useAtualizarPerfil";

import { usuarioPerfilSchema, UsuarioPerfilFormData } from "../schemas/usuarioPerfil.schema";

interface PerfilTabContentProps {
  user: Usuario;
}

export function PerfilTabContent({ user }: PerfilTabContentProps) {

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setError,
    reset,
  } = useForm<UsuarioPerfilFormData>({
    resolver: zodResolver(usuarioPerfilSchema),
    defaultValues: {
      nome: user.nome,
      email: user.email,
    },
  });

  const [backendErrors, setBackendErrors] = useState<string[] | null>(null);

  const { mutate, isPending } = useAtualizarPerfil();

  // Sincroniza caso user seja revalidado
  useEffect(() => {
    reset({
      nome: user.nome,
      email: user.email,
    });
  }, [user, reset]);

  function handleUpdatePerfil(data: UsuarioPerfilFormData) {
    setBackendErrors(null);

    mutate(data, {
      onSuccess: (response) => {
        reset({
          nome: response.data.nome,
          email: response.data.email,
        });

        toast.success("Perfil atualizado com sucesso!");
      },

      onError: (error: AxiosError<ApiErrorResponse>) => {
        const apiErrors = error.response?.data?.errors;

        if (!apiErrors) {
          setBackendErrors(["Erro ao atualizar perfil."]);
          return;
        }

        // 🔴 Erro de regra de negócio
        if (apiErrors.business) {
          setBackendErrors(apiErrors.business);
        }

        // 🟡 Erros de validação
        Object.entries(apiErrors).forEach(([field, messages]) => {
          if (!messages || field === "business") return;

          setError(field as keyof UsuarioPerfilFormData, {
            type: "server",
            message: messages[0],
          });
        });
      },
    });
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Editar Informações Pessoais</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit(handleUpdatePerfil)}>
        <CardContent className="space-y-6 pt-6">

          {backendErrors && backendErrors.length > 0 && (
            <AppAlert
              variant="error"
              subtitle="Ocorreu um erro durante a operação"
              messages={backendErrors}
              onClose={() => setBackendErrors(null)}
              className="mb-6"
            />
          )}

          <div className="grid grid-cols-12 gap-6">

            {/* Nome */}
            <div className="col-span-12 md:col-span-6 space-y-2">
              <Label htmlFor="nome">
                Nome <span className="text-red-600">*</span>
              </Label>

              <Input
                id="nome"
                placeholder="Digite seu nome"
                disabled={isPending}
                className={errors.nome ? "border-red-700 focus-visible:ring-red-700" : ""}
                {...register("nome")}
              />

              {errors.nome && (
                <p className="text-sm text-red-700">
                  {errors.nome.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="col-span-12 md:col-span-6 space-y-2">
              <Label htmlFor="email">
                E-mail <span className="text-red-600">*</span>
              </Label>

              <Input
                id="email"
                type="email"
                placeholder="Digite seu e-mail"
                disabled={isPending}
                className={errors.email ? "border-red-700 focus-visible:ring-red-700" : ""}
                {...register("email")}
              />

              {errors.email && (
                <p className="text-sm text-red-700">
                  {errors.email.message}
                </p>
              )}
            </div>

          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-3 mt-5">
          <Button
            type="submit"
            disabled={isPending || !isDirty}
            className="cursor-pointer"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
