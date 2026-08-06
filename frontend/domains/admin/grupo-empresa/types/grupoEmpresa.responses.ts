import { LaravelApiResponse, LaravelResourcePagination } from "@/types/laravel";

import { GrupoDataResponse } from "../../grupo/types/grupo.responses";

export interface GrupoEmpresaDataResponse {
  id: string;
  nome: string;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;

  grupos?: GrupoDataResponse[]
}

export type CadastrarGrupoEmpresaResponse = LaravelApiResponse<GrupoEmpresaDataResponse>;
export type EditarGrupoEmpresaResponse = LaravelApiResponse<GrupoEmpresaDataResponse>;
export type ListarGrupoEmpresasResponse = LaravelResourcePagination<GrupoEmpresaDataResponse>;
export type AtivarGrupoEmpresaResponse = LaravelApiResponse<GrupoEmpresaDataResponse>;
export type VisualizarGrupoEmpresaResponse = LaravelApiResponse<GrupoEmpresaDataResponse>;