import { LaravelApiResponse, LaravelResourcePagination } from "@/types/laravel";

import { PermissaoDataResponse } from "../../permissao/types/permissao.responses";
import { UsuarioDataResponse } from "../../usuario/types/usuario.responses";

// retono com todos os relacionamentos
export interface GrupoDataResponse {
  id: string;
  versao?: number;
  descricao: string;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;

  usuarios?: UsuarioDataResponse[];
  permissoes?: PermissaoDataResponse[];
}

export type CadastrarGrupoResponse = LaravelApiResponse<GrupoDataResponse>;
export type EditarGrupoResponse = LaravelApiResponse<GrupoDataResponse>;
export type ListarGruposResponse = LaravelResourcePagination<GrupoDataResponse>;
export type AtivarGrupoResponse = LaravelApiResponse<GrupoDataResponse>;
export type VisualizarGrupoResponse = LaravelApiResponse<GrupoDataResponse>;