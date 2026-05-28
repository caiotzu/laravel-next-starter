import { UF } from "@/constants/estados";

export interface CadastrarEmpresaRequest {
  grupo_empresa_id: string;
  matriz_id?: string;
  cnpj: string;
  nome_fantasia: string;
  razao_social: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  uf: UF;
}

export interface EditarEmpresaRequest {
  matriz_id: string;
  cnpj: string;
  nome_fantasia: string;
  razao_social: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  uf: UF;
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
  uf?: UF;
  excluido?: boolean;
  por_pagina?: number;
  page?: number;
}
