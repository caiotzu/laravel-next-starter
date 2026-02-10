"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, X, CircleAlert } from "lucide-react";
import { useForm, UseFormSetError } from "react-hook-form";

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
    reset,
    setError,
  } = useForm<GrupoEmpresasFormData>({
    resolver: zodResolver(grupoEmpresaSchema),
    defaultValues,
  });

  useEffect(() => {
    if (defaultValues) {
      reset(defaultValues);
    }
  }, [defaultValues, reset]);

  // 🔥 registra setError para o Page usar
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
            <Alert variant="destructive" className="relative mb-8">
              {clearBackendErrors && (
                <button
                  type="button"
                  onClick={clearBackendErrors}
                  className="absolute right-4 top-4 text-red-700 hover:text-red-900 transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <CircleAlert className="h-5 w-5" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>
                <ul className="list-inside list-disc text-sm">
                  {backendErrors.map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 md:col-span-4 space-y-2">
              <Label htmlFor="nome">Nome do Grupo</Label>
              <Input
                id="nome"
                placeholder="Digite o nome do grupo"
                disabled={isLoading}
                className={errors.nome ? "border-red-500 focus-visible:ring-red-500" : ""}
                {...register("nome")}
              />
              {errors.nome && (
                <p className="text-sm text-red-500">
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
            {isLoading
              ? defaultValues
                ? "Salvando"
                : "Cadastrando"
              : defaultValues
              ? "Salvar Alterações"
              : "Cadastrar"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
