import { LaravelApiResponse } from "@/types/laravel";

import { EmpresaContatoTipo } from "@/constants/empresa-contato-tipos";

export interface EmpresaContatoDataResponse {
  id: string;
  empresa_id: string;
  tipo: EmpresaContatoTipo;
  tipo_descricao: string;
  valor: string;
  ativo: boolean;
  principal: boolean;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
}

export type CadastrarEmpresaContatoResponse = LaravelApiResponse<EmpresaContatoDataResponse>;
export type EditarEmpresaContatoResponse = LaravelApiResponse<EmpresaContatoDataResponse>;