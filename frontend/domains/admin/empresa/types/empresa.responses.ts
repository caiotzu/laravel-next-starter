import { LaravelPagination } from "@/types/laravel";

import { GrupoEmpresa } from "../../grupo-empresa/types/grupoEmpresa.model";

import { Empresa } from "./empresa.model";

export type CadastrarEmpresaResponse = Empresa;

export type EditarEmpresaResponse = Empresa;

export type AtivarEmpresaResponse = Empresa;

export type EmpresaListaItem = Empresa & {
  grupo_empresa: GrupoEmpresa;
  matriz: Empresa | null;
};
export type ListarEmpresasResponse = LaravelPagination<EmpresaListaItem>

export interface VisualizarEmpresaResponse extends Empresa {
  grupo_empresa: GrupoEmpresa;
  matriz: Empresa | null;
  contatos: {
    id: string;
    empresa_id: string;
    tipo: string;
    valor: string;
    ativo: boolean;
    principal: boolean;
    created_at: string;
    updated_at: string | null;
  }[];
  enderecos: {
    id: string;
    empresa_id: string;
    tipo: string;
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
    municipio?: {
      id: string;
      nome: string;
      uf: string;
    };
  }[];
}
