import { LaravelApiResponse, LaravelResourcePagination } from "@/types/laravel";

import { EmpresaContatoDataResponse } from "../../empresa-contato/types/empresaContato.responses";
import { EmpresaEnderecoDataResponse } from "../../empresa-endereco/types/empresaEndereco.responses";
import { GrupoEmpresaDataResponse } from "../../grupo-empresa/types/grupoEmpresa.responses";
export interface empresaDataResponse {
  id: string;
  grupo_empresa_id: string;
  matriz_id: string | null;
  cnpj: string;
  nome_fantasia: string;
  razao_social: string;
  inscricao_estadual: string | null;
  inscricao_municipal: string | null;
  status: string;
  uf: string;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;

  grupo_empresa?: GrupoEmpresaDataResponse;
  matriz?: empresaDataResponse;

  contatos: EmpresaContatoDataResponse[];
  enderecos: EmpresaEnderecoDataResponse[];
}

export type CadastrarEmpresaResponse = LaravelApiResponse<empresaDataResponse>;
export type EditarEmpresaResponse = LaravelApiResponse<empresaDataResponse>;
export type ListarEmpresasResponse = LaravelResourcePagination<empresaDataResponse>;
export type AtivarEmpresaResponse = LaravelApiResponse<empresaDataResponse>;
export type VisualizarEmpresaResponse = LaravelApiResponse<empresaDataResponse>;

