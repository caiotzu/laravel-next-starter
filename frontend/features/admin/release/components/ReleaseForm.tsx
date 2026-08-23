"use client";

import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { RichTextEditor } from "@/components/editor/RichTextEditor";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { RELEASE_TIPO_OPTIONS } from "@/constants/release-tipo";

import { releaseSchemaCadastro, ReleaseFormData } from "../schemas/release.schema";


const OPCOES_CONTEXTO = [
  { value: "admin", label: "Admin" },
  { value: "private", label: "Private" },
] as const;

interface Props {
  defaultValues?: Partial<ReleaseFormData>;
  onSubmit: (data: ReleaseFormData) => Promise<void>;
  isLoading?: boolean;
  backendErrors?: string[] | null;
  clearBackendErrors?: () => void;
  tituloCard?: string;
  cancelarHref?: string;
  labelSubmit?: string;
}

/**
 * Mesma estrutura visual do MensagemFormCreate (Card > form > CardContent >
 * CardFooter) — a tela de cadastro de Release passou de modal para uma
 * página própria seguindo esse mesmo padrão, para ter espaço adequado ao
 * editor de texto rico.
 */
export function ReleaseForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  backendErrors = null,
  clearBackendErrors,
  tituloCard = "Nova release",
  cancelarHref = "/admin/releases/gerenciar",
  labelSubmit = "Cadastrar release",
}: Props) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ReleaseFormData>({
    resolver: zodResolver(releaseSchemaCadastro),
    defaultValues: {
      contexto: defaultValues?.contexto ?? "private",
      titulo: defaultValues?.titulo ?? "",
      conteudo: defaultValues?.conteudo ?? "",
      tipo: defaultValues?.tipo ?? "feature",
      versao: defaultValues?.versao ?? "",
    },
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{tituloCard}</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6 pt-2">
          {backendErrors && backendErrors.length > 0 && (
            <AppAlert
              variant="error"
              subtitle="Ocorreu um erro durante a operação"
              messages={backendErrors}
              onClose={clearBackendErrors}
              className="mb-2"
            />
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="contexto">Contexto</Label>
              <Controller
                name="contexto"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="contexto" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPCOES_CONTEXTO.map((opcao) => (
                        <SelectItem key={opcao.value} value={opcao.value}>
                          {opcao.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.contexto && (
                <p className="text-sm text-destructive">{errors.contexto.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Controller
                name="tipo"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="tipo" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RELEASE_TIPO_OPTIONS.map((opcao) => (
                        <SelectItem key={opcao.value} value={opcao.value}>
                          {opcao.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.tipo && (
                <p className="text-sm text-destructive">{errors.tipo.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="versao">Versão</Label>
              <Input id="versao" placeholder="Ex: 1.6.0" {...register("versao")} />
              {errors.versao && (
                <p className="text-sm text-destructive">{errors.versao.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              placeholder="Ex: Nova tela de relatórios"
              {...register("titulo")}
            />
            {errors.titulo && (
              <p className="text-sm text-destructive">{errors.titulo.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Conteúdo</Label>
            <Controller
              name="conteudo"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Descreva a novidade para o usuário final..."
                />
              )}
            />
            {errors.conteudo && (
              <p className="text-sm text-destructive">{errors.conteudo.message}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="justify-end gap-2 pt-6">
          <Button variant="outline" asChild>
            <Link href={cancelarHref}>Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isLoading} className="gap-2 cursor-pointer">
            {labelSubmit}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
