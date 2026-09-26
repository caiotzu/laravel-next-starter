import { BannerStatus } from "./banner.model";

export interface BannerFiltros {
  titulo?: string;
  status?: BannerStatus | "";
  excluido?: boolean;
  page?: number;
  por_pagina?: number;
}
