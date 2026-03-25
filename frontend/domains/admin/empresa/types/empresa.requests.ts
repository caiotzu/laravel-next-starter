export interface CadastrarEmpresaRequest {
  grupo_empresa_id: string;
  matriz_id?: string;
  cnpj: string;
  nome_fantasia: string;
  razao_social: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  uf: string;
  enderecos: {
    tipo: string;
    municipio_id: string;
    principal: boolean;
    ativo: boolean;
    cep: string;
    logradouro: string;
    numero: string;
    bairro: string;
    complemento?: string;
  }[];
  contatos: {
    tipo: string;
    valor: string;
    principal: boolean;
    ativo: boolean;
  }[];
}

export interface EditarEmpresaRequest {
  matriz_id: string;
  cnpj: string;
  nome_fantasia: string;
  razao_social: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  uf: string;
  ativo: boolean;
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
