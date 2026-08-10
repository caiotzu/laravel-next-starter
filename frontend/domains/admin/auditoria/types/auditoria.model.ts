export interface AuditoriaUsuario {
  id: string;
  nome: string;
  email: string;
}

export interface Auditoria {
  id: string;
  entidadeTabela: string;
  entidadeId: string;
  registro: string | null;
  agrupadorTabela: string | null;
  agrupadorId: string | null;
  acao: string;
  origem: string;
  dadosAntes: Record<string, unknown> | null;
  dadosDepois: Record<string, unknown> | null;
  camposAlterados: string[] | null;
  ip: string | null;
  userAgent: string | null;
  criadoEm: string;

  usuario?: AuditoriaUsuario | null;
}
