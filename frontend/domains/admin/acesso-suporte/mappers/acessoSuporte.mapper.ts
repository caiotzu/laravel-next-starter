import { AcessoSuporte, AcessoSuporteStatus } from "../types/acessoSuporte.model";
import { AcessoSuporteDataResponse } from "../types/acessoSuporte.responses";

export function toAcessoSuporte(data: AcessoSuporteDataResponse): AcessoSuporte {
  return {
    id: data.id,
    status: data.status as AcessoSuporteStatus,
    entidade: {
      tipo: data.entidade?.tipo ?? null,
      id: data.entidade?.id ?? null,
      nome: data.entidade?.nome ?? null,
    },
    concedidoPor: {
      id: data.concedido_por?.id ?? null,
      nome: data.concedido_por?.nome ?? null,
      email: data.concedido_por?.email ?? null,
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
