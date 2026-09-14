"use client";

import { useState } from "react";

import { UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import { Banner } from "@/domains/admin/banner/types/banner.model";
import { AtualizarBannerRequest } from "@/domains/admin/banner/types/banner.requests";

import { BannerFormData } from "../schemas/banner.schema";
import { BannerLinkErrors, validarBannerLinks } from "../schemas/bannerLink.schema";

import { BannerForm } from "./BannerForm";
import { BannerImagemValue } from "./BannerImagensUploader";
import { BannerLinkValue } from "./BannerLinksField";

interface Props {
  banner: Banner;
  onSubmit: (
    data: AtualizarBannerRequest,
    setError: UseFormSetError<BannerFormData>
  ) => Promise<void>;
  isLoading?: boolean;
  backendErrors?: string[] | null;
  clearBackendErrors?: () => void;
}

/**
 * Converte um ISO/"YYYY-MM-DD HH:mm:ss" vindo do backend para o formato
 * exigido pelo <input type="datetime-local">.
 */
function paraDatetimeLocal(valor: string | null): string {
  if (!valor) return "";

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "";

  const pad = (n: number) => String(n).padStart(2, "0");

  return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}T${pad(data.getHours())}:${pad(data.getMinutes())}`;
}

export function BannerFormEdit({
  banner,
  onSubmit,
  isLoading = false,
  backendErrors = null,
  clearBackendErrors,
}: Props) {
  const [imagens, setImagens] = useState<BannerImagemValue[]>(
    banner.imagens.map((imagem) => ({ tipo: "existente", id: imagem.id, url: imagem.url }))
  );
  const [links, setLinks] = useState<BannerLinkValue[]>(
    banner.links.map((link) => ({ id: link.id, nome: link.nome, url: link.url }))
  );
  const [linkErrors, setLinkErrors] = useState<BannerLinkErrors>({});

  function handleLinksChange(novosLinks: BannerLinkValue[]) {
    setLinks(novosLinks);
    setLinkErrors({});
  }

  async function handleSubmit(
    data: BannerFormData,
    setError: UseFormSetError<BannerFormData>
  ) {
    if (imagens.length === 0) {
      toast.error("É obrigatório manter ao menos uma imagem no banner.");
      return;
    }

    // Mesma validação aplicada no cadastro (ver item 2 do pedido): a
    // regra de nome/URL obrigatórios nos botões não pode valer só para
    // quem está criando um banner — edição segue exatamente a mesma
    // regra, senão o mesmo problema reaparece aqui.
    const errosDosBotoes = validarBannerLinks(links);

    if (Object.keys(errosDosBotoes).length > 0) {
      setLinkErrors(errosDosBotoes);
      toast.error("Corrija os campos obrigatórios dos botões do banner.");
      return;
    }

    setLinkErrors({});

    const payload: AtualizarBannerRequest = {
      titulo: data.titulo,
      conteudo: data.conteudo || undefined,
      inicio_em: data.inicio_em,
      fim_em: data.fim_em || undefined,
      direcionamento: {
        tipo: data.direcionamento_tipo,
        entidade_tipo: data.direcionamento_tipo === "entidade" ? data.entidade_tipo : undefined,
      },
      imagens: imagens.map((imagem) =>
        imagem.tipo === "existente"
          ? { id: imagem.id }
          : { nome: imagem.nome, conteudo: imagem.conteudo }
      ),
      links: links.map((link) => ({ id: link.id, nome: link.nome, url: link.url })),
    };

    await onSubmit(payload, setError);
  }

  return (
    <BannerForm
      title="Editar Banner"
      submitLabel="Salvar alterações"
      defaultValues={{
        titulo: banner.titulo,
        conteudo: banner.conteudo ?? "",
        inicio_em: paraDatetimeLocal(banner.inicioEm),
        fim_em: paraDatetimeLocal(banner.fimEm),
        direcionamento_tipo: banner.direcionamento.tipo,
        entidade_tipo: banner.direcionamento.entidadeTipo ?? undefined,
      }}
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
