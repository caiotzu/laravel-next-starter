import { LaravelPagination } from "@/types/laravel";

import { GrupoEmpresa } from "./grupoEmpresa.model";

export interface CadastrarGrupoEmpresaResponse {
  id: string;
  nome: string;
  created_at: string;
  updated_at: string | null;
}

export interface EditarGrupoEmpresaResponse {
  id: string;
  nome: string;
  created_at: string;
  updated_at: string | null;
}

export type ListarGrupoEmpresasResponse = LaravelPagination<GrupoEmpresa>;


export interface VisualizarGrupoEmpresaResponse extends GrupoEmpresa {
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
      ativo: boolean;
      avatar: string | null;
      google2fa_enable: boolean;
      google2fa_secret: string | null;
      created_at: string;
      updated_at: string | null;
      deleted_at: string | null;
    }[];
  }[];
}