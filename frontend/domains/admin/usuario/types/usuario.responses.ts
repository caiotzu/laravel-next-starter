import { LaravelApiResponse, LaravelResourcePagination } from "@/types/laravel";

import { UsuarioStatus } from "@/constants/usuario-status";

import { GrupoResponse } from "../../grupo/types/grupo.responses";

export interface UsuarioResponse {
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
	grupo?: GrupoResponse
}

export type CadastrarUsuarioResponse = LaravelApiResponse<UsuarioResponse>;
export type EditarUsuarioResponse = LaravelApiResponse<UsuarioResponse>;
export type ListarUsuariosResponse = LaravelResourcePagination<UsuarioResponse>;
export type AtivarUsuarioResponse = LaravelApiResponse<UsuarioResponse>;
export type VisualizarUsuarioResponse = LaravelApiResponse<UsuarioResponse>;