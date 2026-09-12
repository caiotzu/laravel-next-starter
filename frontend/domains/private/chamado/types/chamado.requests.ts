import { ChamadoStatus } from "@/constants/chamado-status";
import { ChamadoTipo } from "@/constants/chamado-tipo";

export interface ListarChamadosRequest {
  status?: ChamadoStatus;
  tipo?: ChamadoTipo;
  ticket?: string;
  page?: number;
  por_pagina?: number;
}

export interface AnexoRequest {
  nome: string;
  conteudo: string;
}

export interface AbrirChamadoRequest {
  tipo: ChamadoTipo;
  assunto: string;
  mensagem: string;
  anexos?: AnexoRequest[];
}

export interface ResponderChamadoRequest {
  mensagem: string;
  anexos?: AnexoRequest[];
}
