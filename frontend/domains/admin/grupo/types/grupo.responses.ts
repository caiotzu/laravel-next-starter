import { LaravelApiResponse, LaravelResourcePagination } from "@/types/laravel";

export interface GrupoResponse {
  id: string;
  descricao: string;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
}


export type ListarGruposResponse = LaravelResourcePagination<GrupoResponse>;
