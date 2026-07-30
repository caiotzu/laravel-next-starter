export interface CadastrarGrupoRequest {
  descricao: string;
}

export interface EditarGrupoRequest {
  descricao: string;
}

export interface ListarGruposRequest {
  id?: string;
  descricao?: string;
  excluido?: boolean;
  por_pagina?: number;
  page?: number;
}

export interface SincronizarPermissoesGrupoRequest {
  permissoes: string[];
}