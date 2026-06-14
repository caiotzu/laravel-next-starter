"use client";

import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { Users, Shield, Loader2 } from "lucide-react";
import { useForm, UseFormSetError } from "react-hook-form";

import { AppAlert } from "@/components/feedback/AppAlert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { GrupoFormDataCadastro, grupoSchemaCadastro } from "../schemas/grupo.schema";

interface Props {
  onSubmit: (
    data: GrupoFormDataCadastro,
    setError: UseFormSetError<GrupoFormDataCadastro>
  ) => Promise<void>;
  isLoading?: boolean;
  backendErrors?: string[] | null;
  clearBackendErrors?: () => void;
}

export function GrupoFormCreate({
  onSubmit,
  isLoading = false,
  backendErrors = null,
  clearBackendErrors
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<GrupoFormDataCadastro>({
    resolver: zodResolver(grupoSchemaCadastro),
  });
 
  async function handleFormSubmit(data: GrupoFormDataCadastro) {
    await onSubmit(data, setError);
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Cadastrar Grupo</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
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

          <Tabs value="grupo" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="dados">
                <Users className="h-4 w-4" />
                Grupo
              </TabsTrigger>
              <TabsTrigger value="enderecos" disabled={true}>
                <Shield className="h-4 w-4" />
                Permissões
              </TabsTrigger>
            </TabsList>

            <TabsContent value="grupo" className="pt-4">
              <div className="rounded-xl border p-6">
                <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-12 md:col-span-4 space-y-2">
                    <Label htmlFor="nome_fantasia">
                      Descrição <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="descricao"
                      {...register("descricao")}
                    />
                    {errors.descricao && (
                      <p className="text-sm text-red-700">
                        {errors.descricao.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex justify-end gap-3 pt-6">
          <Button asChild variant="outline">
            <Link href="/admin/grupos" className="gap-2">
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
