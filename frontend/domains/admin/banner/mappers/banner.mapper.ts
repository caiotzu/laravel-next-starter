import { Banner } from "../types/banner.model";
import { BannerDataResponse } from "../types/banner.responses";

export function toBanner(data: BannerDataResponse): Banner {
  return {
    id: data.id,
    titulo: data.titulo,
    conteudo: data.conteudo,
    status: data.status,
    statusLabel: data.status_label,
    direcionamento: {
      tipo: data.direcionamento.tipo,
      tipoLabel: data.direcionamento.tipo_label,
      entidadeTipo: data.direcionamento.entidade_tipo,
    },
    inicioEm: data.inicio_em,
    fimEm: data.fim_em,
    imagens: (data.imagens ?? [])
      .slice()
      .sort((a, b) => a.ordem - b.ordem)
      .map((imagem) => ({ id: imagem.id, url: imagem.url, ordem: imagem.ordem })),
    links: (data.links ?? [])
      .slice()
      .sort((a, b) => a.ordem - b.ordem)
      .map((link) => ({ id: link.id, nome: link.nome, url: link.url, ordem: link.ordem })),
    totalImagens: data.total_imagens,
    updatedAt: data.updated_at,
    createdAt: data.created_at,
    deletedAt: data.deleted_at,
  };
}
