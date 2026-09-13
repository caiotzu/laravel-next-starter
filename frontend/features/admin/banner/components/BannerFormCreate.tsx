"use client";

import { useState } from "react";

import { UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import { CadastrarBannerRequest } from "@/domains/admin/banner/types/banner.requests";

import { BannerFormData } from "../schemas/banner.schema";

import { BannerForm } from "./BannerForm";
import { BannerImagemValue } from "./BannerImagensUploader";
import { BannerLinkValue } from "./BannerLinksField";

interface Props {
  onSubmit: (
    data: CadastrarBannerRequest,
    setError: UseFormSetError<BannerFormData>
  ) => Promise<void>;
  isLoading?: boolean;
  backendErrors?: string[] | null;
  clearBackendErrors?: () => void;
}

export function BannerFormCreate({
  onSubmit,
  isLoading = false,
  backendErrors = null,
  clearBackendErrors,
}: Props) {
  const [imagens, setImagens] = useState<BannerImagemValue[]>([]);
  const [links, setLinks] = useState<BannerLinkValue[]>([]);

  async function handleSubmit(
    data: BannerFormData,
    setError: UseFormSetError<BannerFormData>
  ) {
    if (imagens.length === 0) {
      toast.error("Adicione ao menos uma imagem para o banner.");
      return;
    }

    const payload: CadastrarBannerRequest = {
      titulo: data.titulo,
      conteudo: data.conteudo || undefined,
      inicio_em: data.inicio_em,
      fim_em: data.fim_em || undefined,
      direcionamento: {
        tipo: data.direcionamento_tipo,
        entidade_tipo: data.direcionamento_tipo === "entidade" ? data.entidade_tipo : undefined,
      },
      imagens: imagens
        .filter((imagem): imagem is Extract<BannerImagemValue, { tipo: "nova" }> => imagem.tipo === "nova")
        .map((imagem) => ({ nome: imagem.nome, conteudo: imagem.conteudo })),
      links: links.map((link) => ({ nome: link.nome, url: link.url })),
    };

    await onSubmit(payload, setError);
  }

  return (
    <BannerForm
      title="Cadastrar Banner"
      submitLabel="Cadastrar"
      imagens={imagens}
      onImagensChange={setImagens}
      links={links}
      onLinksChange={setLinks}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      backendErrors={backendErrors}
      clearBackendErrors={clearBackendErrors}
    />
  );
}
