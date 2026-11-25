import { LaravelApiResponse } from "@/types/laravel";

export interface VinculoSocialDataResponse {
  chave: string;
  nome: string;
  disponivel: boolean;
  vinculado: boolean;
  email: string | null;
  vinculado_em: string | null;
  ultimo_login_em: string | null;
}

export type ListarLoginSocialResponse = LaravelApiResponse<VinculoSocialDataResponse[]>;
export type DesvincularLoginSocialResponse = void;

/** Resposta do BFF ao iniciar o vínculo: só a URL do provedor. */
export type IniciarVinculoLoginSocialResponse = LaravelApiResponse<{ url: string }>;
