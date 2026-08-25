import { ChamadoPrioridade } from "@/constants/chamado-prioridade";
import { ChamadoStatus } from "@/constants/chamado-status";
import { ChamadoTipo } from "@/constants/chamado-tipo";

export interface ChamadoAnexo {
  id: string;
  nomeOriginal: string;
  url: string;
  mimeType: string;
  tamanho: number;
}

export interface ChamadoMensagem {
  id: string;
  mensagem: string;
  usuario: {
    id: string | null;
    nome: string | null;
  };
  anexos: ChamadoAnexo[];
  createdAt: string;
}

export interface Chamado {
  id: string;
  ticket: string;
  assunto: string;
  tipo: ChamadoTipo;
  tipoLabel: string;
  status: ChamadoStatus;
  statusLabel: string;
  prioridade: ChamadoPrioridade;
  prioridadeLabel: string;
  cliente: {
    id: string | null;
    nome: string | null;
    email: string | null;
  };
  responsavel: {
    id: string;
    nome: string;
  } | null;
  abertoEm: string;
  fechadoEm: string | null;
  primeiraRespostaEm: string | null;
  ultimaInteracaoEm: string;
  mensagens: ChamadoMensagem[];
}
