export interface BannerImagemDataResponse {
  id: string;
  url: string;
  ordem: number;
}

export interface BannerLinkDataResponse {
  id: string;
  nome: string;
  url: string;
}

export interface BannerDataResponse {
  id: string;
  titulo: string;
  conteudo: string | null;
  imagens: BannerImagemDataResponse[];
  links: BannerLinkDataResponse[];
}

export type ListarBannersDisponiveisResponse = { data: BannerDataResponse[] };
