"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm, UseFormSetError } from "react-hook-form";

import { AppAlert } from "@/components/feedback/AppAlert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { grupoEmpresaSchemaEdicao, GrupoEmpresasFormDataEdicao } from "../schemas/grupoEmpresa.schema";

interface GrupoEmpresaFormEdicaoProps {
  defaultValues?: GrupoEmpresasFormDataEdicao;
  onSubmit: (data: GrupoEmpresasFormDataEdicao) => Promise<void>;
  isLoading?: boolean;
  backendErrors?: string[] | null;
  clearBackendErrors?: () => void;
  registerSetError?: (fn: UseFormSetError<GrupoEmpresasFormDataEdicao>) => void;
}

export function GrupoEmpresaFormEdicao({
  defaultValues,
  onSubmit,
  isLoading = false,
  backendErrors = null,
  clearBackendErrors,
  registerSetError,
}: GrupoEmpresaFormEdicaoProps) {

  const { register, handleSubmit, formState: { errors }, setError, reset } = useForm<GrupoEmpresasFormDataEdicao>({
    resolver: zodResolver(grupoEmpresaSchemaEdicao),
    defaultValues,
  });

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (defaultValues && !isInitialized) {
      reset(defaultValues);
      setIsInitialized(true);
    }
  }, [defaultValues, isInitialized, reset]);

  useEffect(() => {
    if (registerSetError) {
      registerSetError(setError);
    }
  }, [registerSetError, setError]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Editar Grupo de Empresas</CardTitle>
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
        </CardContent>

        <CardFooter className="flex justify-end gap-3">
          <Button asChild variant="outline">
            <Link href="/admin/grupos-empresas" className="gap-2">
              Cancelar
            </Link>
          </Button>

          <Button type="submit" disabled={isLoading} className="cursor-pointer">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
