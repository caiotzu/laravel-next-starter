import { LaravelApiResponse, LaravelResourcePagination } from "@/types/laravel";

import { EmpresaEnderecoTipo } from "@/constants/empresa-endereco-tipos";

export interface EmpresaEnderecoDataResponse {
  id: string;
  empresa_id: string;
  tipo: EmpresaEnderecoTipo;
  tipo_descricao: string;
  municipio_id: string;
  ativo: boolean;
  principal: boolean;
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  complemento: string | null;
  created_at: string;
  updated_at: string | null;
  deleted_at?: string | null;
  municipio?: {
    id: string;
    nome: string;
    uf: string;
    codigo_ibge: string;
    codigo_siafi: string;
  };
}

export type CadastrarEmpresaEnderecoResponse = LaravelApiResponse<EmpresaEnderecoDataResponse>;
export type EditarEmpresaEnderecoResponse = LaravelApiResponse<EmpresaEnderecoDataResponse>;