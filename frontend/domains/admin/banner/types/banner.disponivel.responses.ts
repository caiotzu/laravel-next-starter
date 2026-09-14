export interface BannerDisponivelImagemDataResponse {
  id: string;
  url: string;
  ordem: number;
}

export interface BannerDisponivelLinkDataResponse {
  id: string;
  nome: string;
  url: string;
}

export interface BannerDisponivelDataResponse {
  id: string;
  titulo: string;
  conteudo: string | null;
  imagens: BannerDisponivelImagemDataResponse[];
  links: BannerDisponivelLinkDataResponse[];
}

export type ListarBannersDisponiveisResponse = { data: BannerDisponivelDataResponse[] };
