export type AcessoSuporteStatus = "ativo" | "expirado" | "revogado" | "encerrado";

export interface AcessoSuporte {
  id: string;
  status: AcessoSuporteStatus;
  entidade: {
    tipo: string | null;
    id: string | null;
    nome: string | null;
  };
  concedidoPor: {
    id: string | null;
    nome: string | null;
    email: string | null;
  };
  motivo: string | null;
  iniciadoEm: string | null;
  expiraEm: string;
  encerradoEm: string | null;
  encerradoPor: "cliente" | "admin" | "expiracao" | "sistema" | null;
  ativo: boolean;
  createdAt: string;
}
