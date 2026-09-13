export interface BannerImagem {
  id: string;
  url: string;
  ordem: number;
}

export interface BannerLink {
  id: string;
  nome: string;
  url: string;
}

export interface Banner {
  id: string;
  titulo: string;
  conteudo: string | null;
  imagens: BannerImagem[];
  links: BannerLink[];
}
