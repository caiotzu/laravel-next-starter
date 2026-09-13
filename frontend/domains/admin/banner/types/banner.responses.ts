import { LaravelResourcePagination } from "@/types/laravel";

import { BannerDirecionamentoTipo, BannerEntidadeTipo, BannerStatus } from "./banner.model";

export interface BannerImagemDataResponse {
  id: string;
  url: string;
  ordem: number;
}

export interface BannerLinkDataResponse {
  id: string;
  nome: string;
  url: string;
  ordem: number;
}

export interface BannerDataResponse {
  id: string;
  titulo: string;
  conteudo: string | null;
  status: BannerStatus;
  status_label: string;
  direcionamento: {
    tipo: BannerDirecionamentoTipo;
    tipo_label: string;
    entidade_tipo: BannerEntidadeTipo | null;
  };
  inicio_em: string;
  fim_em: string | null;
  imagens: BannerImagemDataResponse[];
  links: BannerLinkDataResponse[];
  total_imagens: number | null;
  updated_at: string;
  created_at: string;
  deleted_at: string | null;
}

export type CadastrarBannerResponse = { data: BannerDataResponse };
export type AtualizarBannerResponse = { data: BannerDataResponse };
export type VisualizarBannerResponse = { data: BannerDataResponse };
export type ListarBannersResponse = LaravelResourcePagination<BannerDataResponse>;
