import { LaravelApiResponse } from "@/types/laravel";

export interface AcessoSuporteDataResponse {
  id: string;
  status: string;
  admin: {
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

export type ConcederAcessoSuporteResponse = LaravelApiResponse<AcessoSuporteDataResponse>;
export interface ListarAcessosSuporteResponse {
  data: AcessoSuporteDataResponse[];
}
export type RevogarAcessoSuporteResponse = void;
