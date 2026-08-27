import { ChamadoPrioridade } from "@/constants/chamado-prioridade";
import { ChamadoStatus } from "@/constants/chamado-status";
import { ChamadoTipo } from "@/constants/chamado-tipo";

export interface ListarChamadosRequest {
  status?: ChamadoStatus;
  tipo?: ChamadoTipo;
  page?: number;
  por_pagina?: number;
}

export interface AnexoRequest {
  nome: string;
  conteudo: string;
}

export interface ResponderChamadoRequest {
  mensagem: string;
  anexos?: AnexoRequest[];
}

export interface AtualizarStatusRequest {
  status: ChamadoStatus;
}

export interface AtualizarPrioridadeRequest {
  prioridade: ChamadoPrioridade;
}

export interface AtribuirResponsavelRequest {
  responsavel_id: string | null;
}
