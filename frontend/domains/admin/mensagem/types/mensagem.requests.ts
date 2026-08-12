import { MensagemDirecionamentoTipo } from "./mensagem.model";

export interface CadastrarMensagemRequest {
  titulo: string;
  conteudo: string;
  direcionamento: {
    tipo: MensagemDirecionamentoTipo;
    grupo_empresa_id?: string;
    usuario_id?: string;
  };
}

export interface ListarMensagensRequest {
  id?: string;
  titulo?: string;
  origem?: "sistema" | "admin";
  por_pagina?: number;
  page?: number;
}
