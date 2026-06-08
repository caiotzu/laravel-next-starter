import { LaravelApiResponse, LaravelResourcePagination } from "@/types/laravel";

import { UsuarioDataResponse } from "../../usuario/types/usuario.responses";

// retono com todos os relacionamentos
export interface grupoDataResponse {
  id: string;
  versao?: number;
  descricao: string;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;

  usuarios?: UsuarioDataResponse[]
}

export type ListarGruposResponse = LaravelResourcePagination<grupoDataResponse>;
export type AtivarGrupoResponse = LaravelApiResponse<grupoDataResponse>;

