import { EmpresaStatusValue } from "@/constants/empresa-status";

export interface CadastrarEmpresaRequest {
  grupo_empresa_id: string;
  matriz_id?: string;
  cnpj: string;
  nome_fantasia: string;
  razao_social: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  uf: string;
}

export interface EmpresaContatoRequest {
  tipo: string;
  valor: string;
  principal: boolean;
  ativo: boolean;
}

export interface EmpresaEnderecoRequest {
  tipo: string;
  municipio_id: string;
  principal: boolean;
  ativo: boolean;
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  complemento?: string;
}

export interface EditarEmpresaRequest {
  matriz_id: string;
  cnpj: string;
  nome_fantasia: string;
  razao_social: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  uf: string;
  status: EmpresaStatusValue;
}

export interface ListarEmpresasRequest {
  id?: string;
  grupo_empresa_id?: string;
  matriz_id?: string;
  cnpj?: string;
  nome_fantasia?: string;
  razao_social?: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  ativo?: boolean;
  uf?: string;
  excluido?: boolean;
  por_pagina?: number;
  page?: number;
}
