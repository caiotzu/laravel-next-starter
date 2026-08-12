import { LaravelApiResponse, LaravelResourcePagination } from "@/types/laravel";

import { MensagemOrigem } from "./mensagem.model";

export interface MensagemDataResponse {
  id: string;
  mensagem_id: string;
  titulo: string;
  conteudo: string;
  origem: MensagemOrigem;
  lida: boolean;
  lida_em: string | null;
  created_at: string;
}

export type ListarMensagensResponse = LaravelResourcePagination<MensagemDataResponse>;
export type MarcarComoLidaResponse = LaravelApiResponse<MensagemDataResponse>;

export interface ContadorNaoLidasResponse {
  data: {
    total_nao_lidas: number;
  };
}
