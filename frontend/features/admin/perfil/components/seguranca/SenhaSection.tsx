"use client";

import { useMemo, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ApiErrorResponse } from "@/types/errors";

import { AppAlert } from "@/components/feedback/AppAlert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

import { useAtualizarSenhaPerfil } from "@/domain/admin/perfil/hooks/useAtualizarSenha";

import {
  atualizarSenhaSchema,
  AtualizarSenhaFormData,
} from "../../schemas/usuarioPerfil.schema";

import { RequisitoSenha } from "./RequisitoSenha";

export function SenhaSection() {
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showSenhaNova, setShowSenhaNova] = useState(false);
  const [showSenhaConfirmacao, setShowSenhaConfirmacao] = useState(false);
  const [senhaErrors, setSenhaErrors] = useState<string[] | null>(null);

  const atualizarSenhaMutation = useAtualizarSenhaPerfil();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<AtualizarSenhaFormData>({
    resolver: zodResolver(atualizarSenhaSchema),
  });

  const senhaNova = watch("senha_nova") || "";

  const requisitos = useMemo(
    () => ({
      length: senhaNova.length >= 8,
      upper: /[A-Z]/.test(senhaNova),
      lower: /[a-z]/.test(senhaNova),
      number: /[0-9]/.test(senhaNova),
      special: /[^A-Za-z0-9]/.test(senhaNova),
    }),
    [senhaNova]
  );

  const todosValidos = Object.values(requisitos).every(Boolean);

  function onSubmitSenha(data: AtualizarSenhaFormData) {
    setSenhaErrors(null);

    atualizarSenhaMutation.mutate(data, {
      onSuccess: () => {
        toast.success("Senha atualizada com sucesso!");
        reset();
        setShowSenhaAtual(false);
        setShowSenhaNova(false);
        setShowSenhaConfirmacao(false);
      },
      onError: (error: AxiosError<ApiErrorResponse>) => {
        const apiErrors = error.response?.data?.errors;

        if (!apiErrors) {
          setSenhaErrors(["Erro ao atualizar senha."]);
          return;
        }

        if (apiErrors.business) {
          setSenhaErrors(apiErrors.business);
          return;
        }

        const fieldErrors = Object.entries(apiErrors)
          .filter(([field, messages]) => field !== "business" && Array.isArray(messages))
          .flatMap(([, messages]) => messages ?? []);

        if (fieldErrors.length > 0) {
          setSenhaErrors(fieldErrors);
          return;
        }

        setSenhaErrors(["Erro ao atualizar senha."]);
      },
    });
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock size={18} />
          Alterar Senha
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {senhaErrors && (
          <AppAlert
            variant="error"
            subtitle="Erro"
            messages={senhaErrors}
            onClose={() => setSenhaErrors(null)}
          />
        )}

        <form onSubmit={handleSubmit(onSubmitSenha)} className="space-y-4">
          <Field>
            <InputGroup>
              <InputGroupInput
                type={showSenhaAtual ? "text" : "password"}
                placeholder="Senha atual"
                {...register("senha_atual")}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  type="button"
                  aria-label="visualizar"
                  title="visualizar"
                  size="icon-xs"
                  onClick={() => setShowSenhaAtual((prev) => !prev)}
                >
                  {showSenhaAtual ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
            {errors.senha_atual && <p className="text-sm text-red-500">{errors.senha_atual.message}</p>}
          </Field>

          <div>
            <Field>
              <InputGroup>
                <InputGroupInput
                  type={showSenhaNova ? "text" : "password"}
                  placeholder="Nova senha"
                  {...register("senha_nova")}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    type="button"
                    aria-label="visualizar"
                    title="visualizar"
                    size="icon-xs"
                    onClick={() => setShowSenhaNova((prev) => !prev)}
                  >
                    {showSenhaNova ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </Field>

            <div className="mt-3 space-y-1">
              <RequisitoSenha valido={requisitos.length} texto="Mínimo 8 caracteres" />
              <RequisitoSenha valido={requisitos.upper} texto="Letra maiúscula" />
              <RequisitoSenha valido={requisitos.lower} texto="Letra minúscula" />
              <RequisitoSenha valido={requisitos.number} texto="Número" />
              <RequisitoSenha valido={requisitos.special} texto="Caractere especial" />
            </div>

            {errors.senha_nova && <p className="text-sm text-red-500 mt-1">{errors.senha_nova.message}</p>}
          </div>

          <Field>
            <InputGroup>
              <InputGroupInput
                type={showSenhaConfirmacao ? "text" : "password"}
                placeholder="Confirmar nova senha"
                {...register("senha_nova_confirma")}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  type="button"
                  aria-label="Confirmar nova senha"
                  title="Confirmar nova senha"
                  size="icon-xs"
                  onClick={() => setShowSenhaConfirmacao((prev) => !prev)}
                >
                  {showSenhaConfirmacao ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </Field>
          {errors.senha_nova_confirma && (
            <p className="text-sm text-red-500">{errors.senha_nova_confirma.message}</p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={!todosValidos || atualizarSenhaMutation.isPending}
          >
            {atualizarSenhaMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Atualizar Senha
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
