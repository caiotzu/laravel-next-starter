"use client";

import { useState } from "react";

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
import { AnexosUploader, AnexoValue } from "@/components/upload/AnexosUploader";

import {
  CHAMADO_ANEXO_MIMES,
  CHAMADO_ANEXO_EXTENSOES,
  CHAMADO_ANEXO_TAMANHO_MAXIMO_KB,
  CHAMADO_ANEXOS_MAXIMO_POR_MENSAGEM,
} from "@/constants/chamado-prioridade";
import { CHAMADO_TIPO_OPTIONS } from "@/constants/chamado-tipo";
import { AbrirChamadoRequest } from "@/domains/private/chamado/types/chamado.requests";

import {
  chamadoAberturaSchema,
  ChamadoAberturaFormData,
} from "../schemas/chamado.schema";

interface Props {
  onSubmit: (data: AbrirChamadoRequest) => Promise<void>;
  isLoading?: boolean;
  backendErrors?: string[] | null;
  clearBackendErrors?: () => void;
  cancelarHref: string;
}

export function ChamadoAbrirForm({
  onSubmit,
  isLoading = false,
  backendErrors = null,
  clearBackendErrors,
  cancelarHref,
}: Props) {
  const [anexos, setAnexos] = useState<AnexoValue[]>([]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ChamadoAberturaFormData>({
    resolver: zodResolver(chamadoAberturaSchema),
    defaultValues: {
      tipo: "duvida",
      assunto: "",
      mensagem: "",
    },
  });

  async function handleFormSubmit(data: ChamadoAberturaFormData) {
    await onSubmit({
      ...data,
      anexos: anexos.map((anexo) => ({ nome: anexo.nome, conteudo: anexo.conteudo })),
    });
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Abrir chamado</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
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

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                      {CHAMADO_TIPO_OPTIONS.map((opcao) => (
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
              <Label htmlFor="assunto">Assunto</Label>
              <Input
                id="assunto"
                placeholder="Ex: Não consigo acessar um relatório"
                {...register("assunto")}
              />
              {errors.assunto && (
                <p className="text-sm text-destructive">{errors.assunto.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Controller
              name="mensagem"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Descreva o que você precisa..."
                />
              )}
            />
            {errors.mensagem && (
              <p className="text-sm text-destructive">{errors.mensagem.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Anexos</Label>
            <AnexosUploader
              value={anexos}
              onChange={setAnexos}
              maxArquivos={CHAMADO_ANEXOS_MAXIMO_POR_MENSAGEM}
              tamanhoMaximoKb={CHAMADO_ANEXO_TAMANHO_MAXIMO_KB}
              mimesPermitidos={CHAMADO_ANEXO_MIMES}
              extensoesPermitidas={CHAMADO_ANEXO_EXTENSOES}
              disabled={isLoading}
            />
          </div>
        </CardContent>

        <CardFooter className="justify-end gap-2 pt-6">
          <Button variant="outline" asChild>
            <Link href={cancelarHref}>Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isLoading} className="gap-2 cursor-pointer">
            Abrir chamado
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
