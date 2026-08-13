export type MensagemOrigem = "sistema" | "admin";

export type MensagemDirecionamentoTipo =
  | "geral"
  | "entidade"
  | "grupo_empresa"
  | "usuario";

export type EntidadeTipo = "admin" | "private";

export interface MensagemDirecionamento {
  tipo: MensagemDirecionamentoTipo;
  entidadeTipo: EntidadeTipo | null;
  grupoEmpresaId: string | null;
  grupoEmpresaNome: string | null;
  usuarioId: string | null;
  usuarioNome: string | null;
}

export interface MensagemRemetente {
  id: string;
  nome: string;
}

export interface Mensagem {
  id: string;
  titulo: string;
  conteudo: string;
  origem: MensagemOrigem;
  remetente: MensagemRemetente | null;
  direcionamento?: MensagemDirecionamento;
  totalDestinatarios: number;
  totalLidos: number;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
}
