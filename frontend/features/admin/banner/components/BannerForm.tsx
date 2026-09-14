"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { BannerFormData, bannerSchema } from "../schemas/banner.schema";

import { BannerImagensUploader, BannerImagemValue } from "./BannerImagensUploader";
import { BannerLinksField, BannerLinkValue } from "./BannerLinksField";

interface Props {
  title: string;
  submitLabel: string;
  defaultValues?: Partial<BannerFormData>;
  imagens: BannerImagemValue[];
  onImagensChange: (imagens: BannerImagemValue[]) => void;
  links: BannerLinkValue[];
  onLinksChange: (links: BannerLinkValue[]) => void;
  linkErrors?: Record<number, { nome?: string; url?: string }>;
  onSubmit: (
    data: BannerFormData,
    setError: UseFormSetError<BannerFormData>
  ) => Promise<void>;
  isLoading?: boolean;
  backendErrors?: string[] | null;
  clearBackendErrors?: () => void;
}

export function BannerForm({
  title,
  submitLabel,
  defaultValues,
  imagens,
  onImagensChange,
  links,
  onLinksChange,
  linkErrors,
  onSubmit,
  isLoading = false,
  backendErrors = null,
  clearBackendErrors,
}: Props) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    setError,
  } = useForm<BannerFormData>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      direcionamento_tipo: "geral",
      ...defaultValues,
    },
  });

  const direcionamentoTipo = watch("direcionamento_tipo");

  async function handleFormSubmit(data: BannerFormData) {
    await onSubmit(data, setError);
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <CardContent className="space-y-8 pt-6">
          {backendErrors && backendErrors.length > 0 && (
            <AppAlert
              variant="error"
              subtitle="Ocorreu um erro durante a operação"
              messages={backendErrors}
              onClose={clearBackendErrors}
              className="mb-2"
            />
          )}

          {/* Informações */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Informações</h3>

            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 md:col-span-8 space-y-2">
                <Label htmlFor="titulo">
                  Título <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="titulo"
                  disabled={isLoading}
                  className={errors.titulo ? "border-red-700 focus-visible:ring-red-700" : ""}
                  {...register("titulo")}
                />
                {errors.titulo && <p className="text-sm text-red-700">{errors.titulo.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 space-y-2">
                <Label htmlFor="conteudo">Conteúdo</Label>
                <Textarea
                  id="conteudo"
                  rows={4}
                  disabled={isLoading}
                  placeholder="Texto exibido no corpo do banner (opcional)"
                  {...register("conteudo")}
                />
              </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 md:col-span-4 space-y-2">
                <Label htmlFor="inicio_em">
                  Início da campanha <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="inicio_em"
                  type="datetime-local"
                  disabled={isLoading}
                  className={errors.inicio_em ? "border-red-700 focus-visible:ring-red-700" : ""}
                  {...register("inicio_em")}
                />
                {errors.inicio_em && (
                  <p className="text-sm text-red-700">{errors.inicio_em.message}</p>
                )}
              </div>

              <div className="col-span-12 md:col-span-4 space-y-2">
                <Label htmlFor="fim_em">Término da campanha</Label>
                <Input
                  id="fim_em"
                  type="datetime-local"
                  disabled={isLoading}
                  className={errors.fim_em ? "border-red-700 focus-visible:ring-red-700" : ""}
                  {...register("fim_em")}
                />
                {errors.fim_em && <p className="text-sm text-red-700">{errors.fim_em.message}</p>}
                <p className="text-xs text-muted-foreground">
                  Deixe em branco para uma campanha sem data de término definida.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 md:col-span-4 space-y-2">
                <Label htmlFor="direcionamento_tipo">
                  Direcionamento <span className="text-red-600">*</span>
                </Label>
                <Select
                  value={direcionamentoTipo}
                  onValueChange={(v) => setValue("direcionamento_tipo", v as BannerFormData["direcionamento_tipo"])}
                  disabled={isLoading}
                >
                  <SelectTrigger id="direcionamento_tipo" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="geral">Todos</SelectItem>
                    <SelectItem value="entidade">Entidade</SelectItem>
                  </SelectContent>
                </Select>
                {errors.direcionamento_tipo && (
                  <p className="text-sm text-red-700">{errors.direcionamento_tipo.message}</p>
                )}
              </div>

              {direcionamentoTipo === "entidade" && (
                <div className="col-span-12 md:col-span-4 space-y-2">
                  <Label htmlFor="entidade_tipo">
                    Entidade <span className="text-red-600">*</span>
                  </Label>
                  <Select
                    value={watch("entidade_tipo")}
                    onValueChange={(v) => setValue("entidade_tipo", v as BannerFormData["entidade_tipo"])}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="entidade_tipo" className="w-full">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.entidade_tipo && (
                    <p className="text-sm text-red-700">{errors.entidade_tipo.message}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Imagens */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Imagens <span className="text-red-600">*</span>
            </h3>
            <BannerImagensUploader value={imagens} onChange={onImagensChange} disabled={isLoading} />
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Links</h3>
            <BannerLinksField
              value={links}
              onChange={onLinksChange}
              disabled={isLoading}
              errors={linkErrors}
            />
          </div>
        </CardContent>

        <CardFooter className="justify-end gap-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitLabel}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
