import { BannerStatus } from "./banner.model";

export interface BannerFiltros {
  titulo?: string;
  status?: BannerStatus | "";
  page?: number;
  por_pagina?: number;
}
