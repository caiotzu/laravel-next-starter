import { BannerDisponivel } from "@/domains/admin/banner/types/banner.disponivel";
import { Banner } from "@/domains/admin/banner/types/banner.model";

import { BannerImagemValue } from "../components/BannerImagensUploader";
import { BannerLinkValue } from "../components/BannerLinksField";

/**
 * Monta o formato que `BannerPreviewModal` (por baixo, `BannerCarouselModal`)
 * espera — o MESMO formato usado na exibição real ao usuário — a partir
 * dos dados ATUAIS do formulário de cadastro/edição, mesmo que o banner
 * ainda não tenha sido salvo (sem id, imagens ainda locais). Ver itens 2
 * e 3 do pedido.
 *
 * `id` e os `id` de imagens/links novos são só identificadores de UI
 * (React key) — nunca são enviados a lugar nenhum, então um valor fixo
 * ("preview"/"nova-N"/"novo-N") é suficiente.
 */
export function bannerPreviewDoFormulario(dados: {
  titulo: string;
  conteudo?: string | null;
  imagens: BannerImagemValue[];
  links: BannerLinkValue[];
}): BannerDisponivel {
  return {
    id: "preview",
    titulo: dados.titulo || "Título do banner",
    conteudo: dados.conteudo || null,
    imagens: dados.imagens.map((imagem, index) => ({
      id: imagem.tipo === "existente" ? imagem.id : `nova-${index}`,
      url: imagem.tipo === "existente" ? imagem.url : imagem.previewUrl,
      ordem: index,
    })),
    links: dados.links.map((link, index) => ({
      id: link.id ?? `novo-${index}`,
      nome: link.nome,
      url: link.url,
    })),
  };
}

/**
 * Mesmo formato, a partir de um banner já salvo (ver item 4 do pedido —
 * Preview na listagem, onde só há os dados que já vieram do backend).
 */
export function bannerPreviewDoBannerSalvo(banner: Banner): BannerDisponivel {
  return {
    id: banner.id,
    titulo: banner.titulo,
    conteudo: banner.conteudo,
    imagens: banner.imagens,
    links: banner.links.map((link) => ({ id: link.id, nome: link.nome, url: link.url })),
  };
}
