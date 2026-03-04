// export interface CadastrarEmpresaRequest {
//   nome: string;
// }

// export interface EditarEmpresaRequest {
//   nome: string;
// }

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