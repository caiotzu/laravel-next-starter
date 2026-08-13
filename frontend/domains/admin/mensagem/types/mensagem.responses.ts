import { LaravelApiResponse, LaravelResourcePagination } from "@/types/laravel";

import { MensagemDirecionamentoTipo, MensagemOrigem, EntidadeTipo } from "./mensagem.model";

export interface MensagemDirecionamentoDataResponse {
  tipo: MensagemDirecionamentoTipo;
  entidade_tipo: EntidadeTipo | null;
  grupo_empresa_id: string | null;
  grupo_empresa_nome: string | null;
  usuario_id: string | null;
  usuario_nome: string | null;
}

export interface MensagemDataResponse {
  id: string;
  titulo: string;
  conteudo: string;
  origem: MensagemOrigem;
  remetente: { id: string; nome: string } | null;
  direcionamento?: MensagemDirecionamentoDataResponse;
  total_destinatarios: number;
  total_lidos: number;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
}

export interface UsuarioBuscaDataResponse {
  id: string;
  nome: string;
  email: string;
}

export type CadastrarMensagemResponse = LaravelApiResponse<MensagemDataResponse>;
export type ListarMensagensResponse = LaravelResourcePagination<MensagemDataResponse>;
export type VisualizarMensagemResponse = LaravelApiResponse<MensagemDataResponse>;
export type BuscarUsuariosMensagemResponse = LaravelResourcePagination<UsuarioBuscaDataResponse>;
