import { LaravelApiResponse, LaravelResourcePagination } from "@/types/laravel";

export interface empresaContatoDataResponse {
  id: string;
  empresa_id: string;
  tipo: string;
  tipo_descricao: string;
  valor: string;
  ativo: boolean;
  principal: boolean;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
}

export type CadastrarEmpresaContatoResponse = LaravelApiResponse<empresaContatoDataResponse>;
export type EditarEmpresaContatoResponse = LaravelApiResponse<empresaContatoDataResponse>;