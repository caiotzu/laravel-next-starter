import { CaixaMensagem } from "../types/caixaMensagem.model";
import { CaixaMensagemDataResponse } from "../types/caixaMensagem.responses";

export function toCaixaMensagem(data: CaixaMensagemDataResponse): CaixaMensagem {
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
