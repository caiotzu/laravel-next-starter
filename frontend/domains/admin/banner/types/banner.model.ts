export type BannerStatus = "ativo" | "inativo";
export type BannerDirecionamentoTipo = "geral" | "entidade";
export type BannerEntidadeTipo = "admin" | "private";

export interface BannerImagem {
  id: string;
  url: string;
  ordem: number;
}

export interface BannerLink {
  id: string;
  nome: string;
  url: string;
  ordem: number;
}

export interface BannerDirecionamento {
  tipo: BannerDirecionamentoTipo;
  tipoLabel: string;
  entidadeTipo: BannerEntidadeTipo | null;
}

export interface Banner {
  id: string;
  titulo: string;
  conteudo: string | null;
  status: BannerStatus;
  statusLabel: string;
  direcionamento: BannerDirecionamento;
  inicioEm: string;
  fimEm: string | null;
  imagens: BannerImagem[];
  links: BannerLink[];
  totalImagens: number | null;
  updatedAt: string;
  createdAt: string;
  deletedAt: string | null;
}
