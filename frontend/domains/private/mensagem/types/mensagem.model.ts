export type MensagemOrigem = "sistema" | "admin";

/**
 * Representa a mensagem do ponto de vista do usuário autenticado. O `id`
 * é o identificador do destinatário (usado para marcar como lida), e
 * `mensagemId` é o identificador da mensagem em si.
 */
export interface Mensagem {
  id: string;
  mensagemId: string;
  titulo: string;
  conteudo: string;
  origem: MensagemOrigem;
  lida: boolean;
  lidaEm: string | null;
  createdAt: string;
}
