import { LaravelResourcePagination } from "@/types/laravel";

import { ChamadoPrioridade } from "@/constants/chamado-prioridade";
import { ChamadoStatus } from "@/constants/chamado-status";
import { ChamadoTipo } from "@/constants/chamado-tipo";

export interface ChamadoAnexoDataResponse {
  id: string;
  nome_original: string;
  url: string;
  mime_type: string;
  tamanho: number;
}

export interface ChamadoMensagemDataResponse {
  id: string;
  mensagem: string;
  usuario: {
    id: string | null;
    nome: string | null;
  };
  anexos: ChamadoAnexoDataResponse[];
  created_at: string;
}

export interface ChamadoDataResponse {
  id: string;
  ticket: string;
  assunto: string;
  tipo: ChamadoTipo;
  tipo_label: string;
  status: ChamadoStatus;
  status_label: string;
  prioridade: ChamadoPrioridade;
  prioridade_label: string;
  cliente: {
    id: string | null;
    nome: string | null;
    email: string | null;
  };
  responsavel: {
    id: string;
    nome: string;
  } | null;
  aberto_em: string;
  fechado_em: string | null;
  primeira_resposta_em: string | null;
  ultima_interacao_em: string;
  mensagens?: ChamadoMensagemDataResponse[];
}

export type ListarChamadosResponse = LaravelResourcePagination<ChamadoDataResponse>;
