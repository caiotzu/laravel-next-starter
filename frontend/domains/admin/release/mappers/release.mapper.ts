import { Release } from "../types/release.model";
import { ReleaseDataResponse } from "../types/release.responses";

export function toRelease(data: ReleaseDataResponse): Release {
  return {
    id: data.id,
    contexto: data.contexto,
    titulo: data.titulo,
    conteudo: data.conteudo,
    tipo: data.tipo,
    tipoLabel: data.tipo_label,
    versao: data.versao,
    status: data.status,
    publicadoEm: data.publicado_em,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
