import { LaravelResourcePagination } from "@/types/laravel";

export interface AuditoriaUsuarioDataResponse {
  id: string;
  nome: string;
  email: string;
}

export interface AuditoriaDataResponse {
  id: string;
  entidade_tabela: string;
  entidade_id: string;
  agrupador_tabela: string | null;
  agrupador_id: string | null;
  acao: string;
  origem: string;
  dados_antes: Record<string, unknown> | null;
  dados_depois: Record<string, unknown> | null;
  campos_alterados: string[] | null;
  ip: string | null;
  user_agent: string | null;
  criado_em: string;

  usuario?: AuditoriaUsuarioDataResponse | null;
}

export type ListarAuditoriasResponse = LaravelResourcePagination<AuditoriaDataResponse>;
