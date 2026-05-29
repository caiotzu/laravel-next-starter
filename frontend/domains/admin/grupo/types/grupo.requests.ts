export interface ListarGruposRequest {
  id?: string;
  descricao?: string;
  excluido?: boolean;
  por_pagina?: number;
  page?: number;
}