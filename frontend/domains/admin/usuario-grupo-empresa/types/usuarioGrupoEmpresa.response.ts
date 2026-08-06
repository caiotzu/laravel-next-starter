import { LaravelApiResponse } from "@/types/laravel";

import { UsuarioStatus } from "@/constants/usuario-status";

import { GrupoDataResponse } from "../../grupo/types/grupo.responses";

export interface UsuarioGrupoEmpresaDataResponse {
  id: string;
  grupo_id: string;
  nome: string;
  email: string;
  status: UsuarioStatus;
  avatar: string | null;
  google2fa_enable: boolean | null;
  google2fa_confirmado_em: string | null;
  ultimo_login_em: string | null;
  ultimo_ip: string | null;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;

  grupo?: GrupoDataResponse
}

export interface RedefinirSenhaDataResponse {
  mensagem: string;
}

export type RedefinirSenhaUsuarioGrupoEmpresaResponse = LaravelApiResponse<RedefinirSenhaDataResponse>;
export type AlterarStatusUsuarioGrupoEmpresaResponse = LaravelApiResponse<UsuarioGrupoEmpresaDataResponse>;
