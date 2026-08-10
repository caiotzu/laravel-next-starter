import { LaravelPagination } from "@/types/laravel";

export interface AuditoriaEntidadeOption {
  value: string;
  label: string;
}

export interface AuditoriaEntidadeRegistro {
  id: string;
  label: string;
}

export interface ListarRegistrosAuditoriaEntidadeRequest {
  busca?: string;
  por_pagina?: number;
  page?: number;
}

export type ListarRegistrosAuditoriaEntidadeResponse =
  LaravelPagination<AuditoriaEntidadeRegistro>;
