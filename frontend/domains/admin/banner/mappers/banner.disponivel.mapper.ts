import { BannerDisponivel } from "../types/banner.disponivel";
import { BannerDisponivelDataResponse } from "../types/banner.disponivel.responses";

/**
 * Mesma lógica de `domains/private/banner/mappers/banner.mapper.ts`
 * (`toBanner`) — replicada aqui em vez de reaproveitada porque os dois
 * domínios (admin/private) já são inteiramente separados no projeto, e
 * este mapper "enxuto" convive com o `toBanner`/`toBannerAdmin` já
 * existente neste mesmo domínio, que serve a um propósito diferente
 * (gestão, não exibição).
 */
export function toBannerDisponivel(data: BannerDisponivelDataResponse): BannerDisponivel {
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
