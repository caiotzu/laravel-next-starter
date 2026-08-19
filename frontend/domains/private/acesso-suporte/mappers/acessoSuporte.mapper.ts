import { AcessoSuporte, AcessoSuporteStatus } from "../types/acessoSuporte.model";
import { AcessoSuporteDataResponse } from "../types/acessoSuporte.responses";

export function toAcessoSuporte(data: AcessoSuporteDataResponse): AcessoSuporte {
  return {
    id: data.id,
    status: data.status as AcessoSuporteStatus,
    admin: {
      id: data.admin?.id ?? null,
      nome: data.admin?.nome ?? null,
      email: data.admin?.email ?? null,
    },
    motivo: data.motivo,
    iniciadoEm: data.iniciado_em,
    expiraEm: data.expira_em,
    encerradoEm: data.encerrado_em,
    encerradoPor: data.encerrado_por as AcessoSuporte["encerradoPor"],
    ativo: data.ativo,
    createdAt: data.created_at,
  };
}
