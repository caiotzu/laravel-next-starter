import { LaravelApiResponse, LaravelResourcePagination } from "@/types/laravel";

import { UsuarioStatus } from "@/constants/usuario-status";

import { grupoDataResponse } from "../../grupo/types/grupo.responses";

export interface UsuarioDataResponse {
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

  grupo?: grupoDataResponse
}

export type CadastrarUsuarioResponse = LaravelApiResponse<UsuarioDataResponse>;
export type EditarUsuarioResponse = LaravelApiResponse<UsuarioDataResponse>;
export type ListarUsuariosResponse = LaravelResourcePagination<UsuarioDataResponse>;
export type AtivarUsuarioResponse = LaravelApiResponse<UsuarioDataResponse>;
export type VisualizarUsuarioResponse = LaravelApiResponse<UsuarioDataResponse>;