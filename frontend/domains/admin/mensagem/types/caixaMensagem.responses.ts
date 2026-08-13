import { LaravelApiResponse, LaravelResourcePagination } from "@/types/laravel";

import { MensagemOrigem } from "./caixaMensagem.model";

export interface CaixaMensagemDataResponse {
  id: string;
  mensagem_id: string;
  titulo: string;
  conteudo: string;
  origem: MensagemOrigem;
  lida: boolean;
  lida_em: string | null;
  created_at: string;
}

export type ListarCaixaMensagensResponse = LaravelResourcePagination<CaixaMensagemDataResponse>;
export type MarcarCaixaMensagemComoLidaResponse = LaravelApiResponse<CaixaMensagemDataResponse>;

export interface CaixaContadorNaoLidasResponse {
  data: {
    total_nao_lidas: number;
  };
}
