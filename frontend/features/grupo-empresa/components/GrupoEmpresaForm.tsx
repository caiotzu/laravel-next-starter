"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, X, CircleAlert, CircleX } from "lucide-react";
import { useForm, UseFormSetError } from "react-hook-form";

import { AppAlert } from "@/components/feedback/AppAlert";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
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
  grupoEmpresaSchema,
  GrupoEmpresasFormData,
} from "../schemas/grupoEmpresa.schema";

interface GrupoEmpresaFormProps {
  defaultValues?: GrupoEmpresasFormData;
  onSubmit: (data: GrupoEmpresasFormData) => Promise<void>;
  isLoading?: boolean;
  backendErrors?: string[] | null;
  clearBackendErrors?: () => void;
  registerSetError?: (fn: UseFormSetError<GrupoEmpresasFormData>) => void;
}

export function GrupoEmpresaForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  backendErrors = null,
  clearBackendErrors,
  registerSetError,
}: GrupoEmpresaFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<GrupoEmpresasFormData>({
    resolver: zodResolver(grupoEmpresaSchema),
    defaultValues,
  });

  useEffect(() => {
    if (registerSetError) {
      registerSetError(setError);
    }
  }, [registerSetError, setError]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {defaultValues
            ? "Editar Grupo de Empresas"
            : "Cadastrar Grupo de Empresas"}
        </CardTitle>
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
              <Label htmlFor="nome">Nome do Grupo</Label>
              <Input
                id="nome"
                placeholder="Digite o nome do grupo"
                disabled={isLoading}
                className={
                  errors.nome
                    ? "border-red-700 focus-visible:ring-red-700"
                    : ""
                }
                {...register("nome")}
              />
              {errors.nome && (
                <p className="text-sm text-red-700">
                  {errors.nome.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            className="cursor-pointer"
            onClick={() => router.push("/admin/grupos-empresas")}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            disabled={isLoading}
            className="cursor-pointer"
          >
            {isLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {defaultValues ? "Salvar Alterações" : "Cadastrar"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
