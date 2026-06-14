import { LaravelApiResponse, LaravelResourcePagination } from "@/types/laravel";

import { PermissaoDataResponse } from "../../permissao/types/permissao.responses";
import { UsuarioDataResponse } from "../../usuario/types/usuario.responses";

// retono com todos os relacionamentos
export interface grupoDataResponse {
  id: string;
  versao?: number;
  descricao: string;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;

  usuarios?: UsuarioDataResponse[];
  permissoes?: PermissaoDataResponse[]
}

export type CadastrarGrupoResponse = LaravelApiResponse<grupoDataResponse>;
export type EditarGrupoResponse = LaravelApiResponse<grupoDataResponse>;
export type ListarGruposResponse = LaravelResourcePagination<grupoDataResponse>;
export type AtivarGrupoResponse = LaravelApiResponse<grupoDataResponse>;
export type VisualizarGrupoResponse = LaravelApiResponse<grupoDataResponse>;


