"use client";

import { useState } from "react";

import { UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import { CadastrarBannerRequest } from "@/domains/admin/banner/types/banner.requests";

import { BannerFormData } from "../schemas/banner.schema";
import { BannerLinkErrors, validarBannerLinks } from "../schemas/bannerLink.schema";

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
  const [linkErrors, setLinkErrors] = useState<BannerLinkErrors>({});

  function handleLinksChange(novosLinks: BannerLinkValue[]) {
    setLinks(novosLinks);
    // Os erros ficam desatualizados assim que o usuário edita qualquer
    // botão — a próxima tentativa de envio revalida e os repõe se ainda
    // fizer sentido, então não há por que manter um erro antigo visível
    // sobre um valor que já mudou.
    setLinkErrors({});
  }

  async function handleSubmit(
    data: BannerFormData,
    setError: UseFormSetError<BannerFormData>
  ) {
    if (imagens.length === 0) {
      toast.error("Adicione ao menos uma imagem para o banner.");
      return;
    }

    // Ver item 2.1 do pedido: o formulário deve impedir o envio de um
    // botão incompleto — nome e URL são obrigatórios em TODOS os botões,
    // não só no primeiro. Isso não substitui a validação do backend
    // (mantida em CadastrarRequest), só evita uma viagem ao servidor
    // para um erro que já é detectável no cliente.
    const errosDosBotoes = validarBannerLinks(links);

    if (Object.keys(errosDosBotoes).length > 0) {
      setLinkErrors(errosDosBotoes);
      toast.error("Corrija os campos obrigatórios dos botões do banner.");
      return;
    }

    setLinkErrors({});

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
      onLinksChange={handleLinksChange}
      linkErrors={linkErrors}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      backendErrors={backendErrors}
      clearBackendErrors={clearBackendErrors}
    />
  );
}

