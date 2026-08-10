import { ListarAuditoriasRequest } from "./auditoria.requests";

export interface AuditoriaFilters extends ListarAuditoriasRequest {
  usuario_nome?: string;
  entidade_nome?: string;
}
