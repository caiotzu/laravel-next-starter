import { Mensagem } from "../types/mensagem.model";
import { MensagemDataResponse } from "../types/mensagem.responses";

export function toMensagem(data: MensagemDataResponse): Mensagem {
  return {
    id: data.id,
    titulo: data.titulo,
    conteudo: data.conteudo,
    origem: data.origem,
    remetente: data.remetente,
    direcionamento: data.direcionamento
      ? {
          tipo: data.direcionamento.tipo,
          entidadeTipo: data.direcionamento.entidade_tipo,
          grupoEmpresaId: data.direcionamento.grupo_empresa_id,
          grupoEmpresaNome: data.direcionamento.grupo_empresa_nome,
          usuarioId: data.direcionamento.usuario_id,
          usuarioNome: data.direcionamento.usuario_nome,
        }
      : undefined,
    totalDestinatarios: data.total_destinatarios,
    totalLidos: data.total_lidos,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    deletedAt: data.deleted_at,
  };
}
