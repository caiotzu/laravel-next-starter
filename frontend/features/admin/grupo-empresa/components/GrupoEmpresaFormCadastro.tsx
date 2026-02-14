"use client";

import { useEffect } from "react";

import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm, UseFormSetError } from "react-hook-form";

import { AppAlert } from "@/components/feedback/AppAlert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  grupoEmpresaSchemaCadastro,
  GrupoEmpresasFormDataCadastro,
} from "../schemas/grupoEmpresa.schema";

interface GrupoEmpresaFormCadastroProps {
  onSubmit: (data: GrupoEmpresasFormDataCadastro) => Promise<void>;
  isLoading?: boolean;
  backendErrors?: string[] | null;
  clearBackendErrors?: () => void;
  registerSetError?: (fn: UseFormSetError<GrupoEmpresasFormDataCadastro>) => void;
}

export function GrupoEmpresaFormCadastro({
  onSubmit,
  isLoading = false,
  backendErrors = null,
  clearBackendErrors,
  registerSetError,
}: GrupoEmpresaFormCadastroProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<GrupoEmpresasFormDataCadastro>({
    resolver: zodResolver(grupoEmpresaSchemaCadastro),
  });

  useEffect(() => {
    if (registerSetError) {
      registerSetError(setError);
    }
  }, [registerSetError, setError]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Cadastrar Grupo de Empresas</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6 pt-6">
          {backendErrors && backendErrors.length > 0 && (
            <AppAlert
              variant="error"
              subtitle="Ocorreu um erro durante a operação"
              messages={backendErrors}
              onClose={clearBackendErrors}
              className="mb-6"
            />
          )}

          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 md:col-span-4 space-y-2">
              <Label htmlFor="nome">Nome do Grupo <span className="text-red-600">*</span></Label>
              <Input
                id="nome"
                placeholder="Digite o nome do grupo"
                disabled={isLoading}
                className={errors.nome ? "border-red-700 focus-visible:ring-red-700" : ""}
                {...register("nome")}
              />
              {errors.nome && <p className="text-sm text-red-700">{errors.nome.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6 mt-4">
            <div className="col-span-12 md:col-span-4 space-y-2">
              <Label htmlFor="usuario_nome">Nome do Usuário <span className="text-red-600">*</span></Label>
              <Input
                id="usuario_nome"
                placeholder="Digite o nome do usuário"
                disabled={isLoading}
                className={errors.usuario?.nome ? "border-red-700 focus-visible:ring-red-700" : ""}
                {...register("usuario.nome")}
              />
              {errors.usuario?.nome && (
                <p className="text-sm text-red-700">{errors.usuario.nome.message}</p>
              )}
            </div>

            <div className="col-span-12 md:col-span-4 space-y-2">
              <Label htmlFor="usuario_email">E-mail do Usuário <span className="text-red-600">*</span></Label>
              <Input
                id="usuario_email"
                type="email"
                placeholder="Digite o e-mail do usuário"
                disabled={isLoading}
                className={errors.usuario?.email ? "border-red-700 focus-visible:ring-red-700" : ""}
                {...register("usuario.email")}
              />
              {errors.usuario?.email && (
                <p className="text-sm text-red-700">{errors.usuario.email.message}</p>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-3 pt-6">
          <Button asChild variant="outline">
            <Link href="/admin/grupos-empresas" className="gap-2">
              Cancelar
            </Link>
          </Button>

          <Button type="submit" disabled={isLoading} className="cursor-pointer">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cadastrar
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
