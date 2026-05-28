import { LaravelApiResponse, LaravelPagination, LaravelResourcePagination } from "@/types/laravel";

export interface GrupoEmpresaResponse {
  id: string;
  nome: string;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
}

export interface VisualizarGrupoEmpresaData extends GrupoEmpresaResponse {
  grupos: {
    id: string;
    descricao: string;
    versao: number;
    entidade_tipo_id: string;
    entidade_id: string;
    created_at: string;
    updated_at: string | null;
    deleted_at: string | null;

    usuarios: {
      id: string;
      grupo_id: string;
      nome: string;
      email: string;
      status: string;
      avatar: string | null;
      google2fa_enable: boolean;
      google2fa_secret: string | null;
      created_at: string;
      updated_at: string | null;
      deleted_at: string | null;
    }[];
  }[];
}

export type CadastrarGrupoEmpresaResponse = LaravelApiResponse<GrupoEmpresaResponse>;
export type EditarGrupoEmpresaResponse = LaravelApiResponse<GrupoEmpresaResponse>;
export type ListarGrupoEmpresasResponse = LaravelResourcePagination<GrupoEmpresaResponse>;
export type AtivarGrupoEmpresaResponse = LaravelApiResponse<GrupoEmpresaResponse>;
export type VisualizarGrupoEmpresaResponse = LaravelApiResponse<VisualizarGrupoEmpresaData>;




