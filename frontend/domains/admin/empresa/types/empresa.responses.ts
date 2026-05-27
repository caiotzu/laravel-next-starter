import { LaravelResourcePagination } from "@/types/laravel";

import { GrupoEmpresa } from "../../grupo-empresa/types/grupoEmpresa.model";

import { Empresa } from "./empresa.model";

export type CadastrarEmpresaResponse = Empresa;

export type EditarEmpresaResponse = Empresa;

export type AtivarEmpresaResponse = Empresa;

export type EmpresaListaItem = Empresa & {
  grupo_empresa: GrupoEmpresa;
  matriz: Empresa | null;
};
export type ListarEmpresasResponse = LaravelResourcePagination<EmpresaListaItem>

export interface EmpresaContatoResponse {
  id: string;
  empresa_id: string;
  tipo: string;
  tipo_descricao: string;
  valor: string;
  ativo: boolean;
  principal: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface EmpresaEnderecoResponse {
  id: string;
  empresa_id: string;
  tipo: string;
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
  };
}

export interface VisualizarEmpresaResponse extends Empresa {
  grupo_empresa: GrupoEmpresa;
  matriz?: Empresa | null;
  contatos: EmpresaContatoResponse[];
  enderecos: EmpresaEnderecoResponse[];
}
