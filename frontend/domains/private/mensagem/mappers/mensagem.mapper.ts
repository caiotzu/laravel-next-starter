import { Mensagem } from "../types/mensagem.model";
import { MensagemDataResponse } from "../types/mensagem.responses";

export function toMensagem(data: MensagemDataResponse): Mensagem {
  return {
    id: data.id,
    mensagemId: data.mensagem_id,
    titulo: data.titulo,
    conteudo: data.conteudo,
    origem: data.origem,
    lida: data.lida,
    lidaEm: data.lida_em,
    createdAt: data.created_at,
  };
}
