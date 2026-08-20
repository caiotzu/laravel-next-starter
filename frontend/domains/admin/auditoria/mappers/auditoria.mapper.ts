import { Auditoria } from "../types/auditoria.model";
import { AuditoriaDataResponse } from "../types/auditoria.responses";

export function toAuditoria(data: AuditoriaDataResponse): Auditoria {
  return {
    id: data.id,
    entidadeTabela: data.entidade_tabela,
    entidadeId: data.entidade_id,
    registro: data.registro,
    agrupadorTabela: data.agrupador_tabela,
    agrupadorId: data.agrupador_id,
    acao: data.acao,
    origem: data.origem,
    dadosAntes: data.dados_antes,
    dadosDepois: data.dados_depois,
    camposAlterados: data.campos_alterados,
    ip: data.ip,
    userAgent: data.user_agent,
    criadoEm: data.criado_em,
    acessoSuporteId: data.acesso_suporte_id,
    usuario: data.usuario
      ? {
          id: data.usuario.id,
          nome: data.usuario.nome,
          email: data.usuario.email,
        }
      : undefined,
  };
}
