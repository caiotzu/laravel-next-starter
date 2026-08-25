import { Chamado, ChamadoAnexo, ChamadoMensagem } from "../types/chamado.model";
import {
  ChamadoAnexoDataResponse,
  ChamadoDataResponse,
  ChamadoMensagemDataResponse,
} from "../types/chamado.responses";

function toAnexo(data: ChamadoAnexoDataResponse): ChamadoAnexo {
  return {
    id: data.id,
    nomeOriginal: data.nome_original,
    url: data.url,
    mimeType: data.mime_type,
    tamanho: data.tamanho,
  };
}

function toMensagem(data: ChamadoMensagemDataResponse): ChamadoMensagem {
  return {
    id: data.id,
    mensagem: data.mensagem,
    usuario: data.usuario,
    anexos: (data.anexos ?? []).map(toAnexo),
    createdAt: data.created_at,
  };
}

export function toChamado(data: ChamadoDataResponse): Chamado {
  return {
    id: data.id,
    ticket: data.ticket,
    assunto: data.assunto,
    tipo: data.tipo,
    tipoLabel: data.tipo_label,
    status: data.status,
    statusLabel: data.status_label,
    abertoEm: data.aberto_em,
    fechadoEm: data.fechado_em,
    ultimaInteracaoEm: data.ultima_interacao_em,
    mensagens: (data.mensagens ?? []).map(toMensagem),
  };
}
