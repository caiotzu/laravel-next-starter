import { LaravelApiResponse } from "@/types/laravel";

export interface PermissaoDataResponse {
  id: string;
  chave: string;
  descricao: string;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
}

export type ListarPermissoesResponse = LaravelApiResponse<PermissaoDataResponse[]>;