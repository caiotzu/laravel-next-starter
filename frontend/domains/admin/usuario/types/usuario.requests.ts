export interface CadastrarUsuarioRequest {
  grupo_id: string;
  nome: string;
  email: string;
}

export interface EditarUsuarioRequest {
  grupo_id: string;
  nome: string;
  email: string;
}

export interface ListarUsuarioRequest {
  id?: string;
  nome?: string;
  grupo_id?: string;
  excluido?: boolean;
  por_pagina?: number;
  page?: number;
}