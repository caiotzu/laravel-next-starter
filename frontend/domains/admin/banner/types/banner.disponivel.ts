/**
 * Mesma forma enxuta usada em `domains/private/banner/types/banner.model.ts`
 * — este é o formato de EXIBIÇÃO de uma campanha (o que o Admin vê quando
 * um banner está direcionado a ele), não o modelo de GESTÃO já existente
 * em `banner.model.ts` deste domínio (que tem status, direcionamento,
 * datas de auditoria etc., usado nas telas de CRUD).
 */
export interface BannerDisponivelImagem {
  id: string;
  url: string;
  ordem: number;
}

export interface BannerDisponivelLink {
  id: string;
  nome: string;
  url: string;
}

export interface BannerDisponivel {
  id: string;
  titulo: string;
  conteudo: string | null;
  imagens: BannerDisponivelImagem[];
  links: BannerDisponivelLink[];
}
