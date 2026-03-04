export interface CadastrarGrupoEmpresaRequest {
  nome: string;
}

export interface EditarGrupoEmpresaRequest {
  nome: string;
}

export interface ListarGrupoEmpresasRequest {
  id?: string;
  nome?: string;
  excluido?: boolean;
  por_pagina?: number;
  page?: number;
}


