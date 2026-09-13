import { Banner } from "../types/banner.model";
import { BannerDataResponse } from "../types/banner.responses";

export function toBanner(data: BannerDataResponse): Banner {
  return {
    id: data.id,
    titulo: data.titulo,
    conteudo: data.conteudo,
    imagens: (data.imagens ?? [])
      .slice()
      .sort((a, b) => a.ordem - b.ordem)
      .map((imagem) => ({ id: imagem.id, url: imagem.url, ordem: imagem.ordem })),
    links: (data.links ?? []).map((link) => ({ id: link.id, nome: link.nome, url: link.url })),
  };
}
