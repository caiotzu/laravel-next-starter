export interface ListarAuditoriasRequest {
  entidade_tabela?: string;
  entidade_id?: string;
  agrupador_tabela?: string;
  agrupador_id?: string;
  acao?: string;
  usuario_id?: string;
  data_inicio?: string;
  data_fim?: string;
  incluir_dependentes: boolean
  por_pagina?: number;
  page?: number;
}
