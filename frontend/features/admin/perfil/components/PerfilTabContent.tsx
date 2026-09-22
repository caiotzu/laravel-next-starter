"use client";

import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ApiErrorResponse } from "@/types/errors";

import { AppAlert } from "@/components/feedback/AppAlert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useAtualizarPerfil } from "@/domains/admin/perfil/usuario/hooks/useAtualizarPerfil";
import { Usuario } from "@/domains/admin/perfil/usuario/types/usuario.model";

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
    watch,
  } = useForm<UsuarioPerfilFormData>({
    resolver: zodResolver(usuarioPerfilSchema),
    defaultValues: {
      nome: user.nome,
      email: user.email,
      senha_atual: "",
    },
  });

  const [backendErrors, setBackendErrors] = useState<string[] | null>(null);

  const { mutate, isPending } = useAtualizarPerfil();

  // Sincroniza caso user seja revalidado
  useEffect(() => {
    reset({
      nome: user.nome,
      email: user.email,
      senha_atual: "",
    });
  }, [user, reset]);

  // A senha atual só é pedida quando o e-mail está sendo alterado.
  const emailAlterado = watch("email") !== user.email;

  function handleUpdatePerfil(data: UsuarioPerfilFormData) {
    setBackendErrors(null);

    const alterouEmail = data.email !== user.email;

    if (alterouEmail && !data.senha_atual) {
      setError("senha_atual", {
        type: "manual",
        message: "Informe sua senha atual para alterar o e-mail.",
      });
      return;
    }

    mutate(
      {
        nome: data.nome,
        email: data.email,
        ...(alterouEmail ? { senha_atual: data.senha_atual } : {}),
      },
      {
      onSuccess: (response) => {
        reset({
          nome: response.nome,
          email: response.email,
          senha_atual: "",
        });

        toast.success("Perfil atualizado com sucesso!");
      },

      onError: (error: AxiosError<ApiErrorResponse>) => {
        const apiErrors = error.response?.data?.errors;

        if (!apiErrors) {
          setBackendErrors(["Erro ao atualizar perfil."]);
          return;
        }

        // Erro de regra de negócio
        if (apiErrors.business) {
          setBackendErrors(apiErrors.business);
        }

        // Erros de validação
        Object.entries(apiErrors).forEach(([field, messages]) => {
          if (!messages || field === "business") return;

          setError(field as keyof UsuarioPerfilFormData, {
            type: "server",
            message: messages[0],
          });
        });
      },
      }
    );
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

            {/* Senha atual: reautenticação exigida para trocar o e-mail */}
            {emailAlterado && (
              <div className="col-span-12 md:col-span-6 space-y-2">
                <Label htmlFor="senha_atual">
                  Senha atual <span className="text-red-600">*</span>
                </Label>

                <Input
                  id="senha_atual"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Confirme com sua senha atual"
                  disabled={isPending}
                  className={errors.senha_atual ? "border-red-700 focus-visible:ring-red-700" : ""}
                  {...register("senha_atual")}
                />

                <p className="text-xs text-muted-foreground">
                  Por segurança, a senha é exigida para alterar o e-mail.
                </p>

                {errors.senha_atual && (
                  <p className="text-sm text-red-700">
                    {errors.senha_atual.message}
                  </p>
                )}
              </div>
            )}

          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-3 mt-5">
          <Button
            type="submit"
            disabled={isPending || !isDirty}
            className="cursor-pointer"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
