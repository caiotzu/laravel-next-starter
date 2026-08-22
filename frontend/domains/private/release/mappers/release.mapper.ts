import { Release } from "../types/release.model";
import { ReleaseDataResponse } from "../types/release.responses";

export function toRelease(data: ReleaseDataResponse): Release {
  return {
    id: data.id,
    titulo: data.titulo,
    conteudo: data.conteudo,
    tipo: data.tipo,
    tipoLabel: data.tipo_label,
    versao: data.versao,
    publicadoEm: data.publicado_em,
  };
}
