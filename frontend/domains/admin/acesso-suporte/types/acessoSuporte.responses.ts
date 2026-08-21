import { LaravelResourcePagination } from "@/types/laravel";

export interface AcessoSuporteDataResponse {
  id: string;
  status: string;
  entidade: {
    tipo: string | null;
    id: string | null;
    nome: string | null;
  };
  concedido_por: {
    id: string | null;
    nome: string | null;
    email: string | null;
  };
  motivo: string | null;
  iniciado_em: string | null;
  expira_em: string;
  encerrado_em: string | null;
  encerrado_por: string | null;
  ativo: boolean;
  created_at: string;
}

export type ListarAcessosSuporteResponse = LaravelResourcePagination<AcessoSuporteDataResponse>;

export type EncerrarAcessoSuporteResponse = void;
