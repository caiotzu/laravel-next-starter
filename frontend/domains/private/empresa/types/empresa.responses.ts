import { LaravelApiResponse, LaravelResourcePagination } from "@/types/laravel";

import { EmpresaStatus } from "@/constants/empresa-status";

import { EmpresaContatoDataResponse } from "../../empresa-contato/types/empresaContato.responses";
import { EmpresaEnderecoDataResponse } from "../../empresa-endereco/types/empresaEndereco.responses";
import { GrupoEmpresaDataResponse } from "../../grupo-empresa/types/grupoEmpresa.responses";

export interface EmpresaDataResponse {
  id: string;
  grupo_empresa_id: string;
  matriz_id: string | null;
  cnpj: string;
  nome_fantasia: string;
  razao_social: string;
  inscricao_estadual: string | null;
  inscricao_municipal: string | null;
  status: EmpresaStatus;
  uf: string;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;

  grupo_empresa?: GrupoEmpresaDataResponse;
  matriz?: EmpresaDataResponse;

  contatos: EmpresaContatoDataResponse[];
  enderecos: EmpresaEnderecoDataResponse[];
}

export type CadastrarEmpresaResponse = LaravelApiResponse<EmpresaDataResponse>;
export type EditarEmpresaResponse = LaravelApiResponse<EmpresaDataResponse>;
export type ListarEmpresasResponse = LaravelResourcePagination<EmpresaDataResponse>;
export type AtivarEmpresaResponse = LaravelApiResponse<EmpresaDataResponse>;
export type VisualizarEmpresaResponse = LaravelApiResponse<EmpresaDataResponse>;

