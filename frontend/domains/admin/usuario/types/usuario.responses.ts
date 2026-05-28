import { LaravelResourcePagination } from "@/types/laravel";

import { Usuario } from "./usuario.model";

export interface CadastrarUsuarioResponse {
  id: string;
	grupo_id: string;
	nome: string;
	email: string;
	status: string;
	avatar: null;
	google2fa_enable: null,
	google2fa_confirmado_em: null,
	ultimo_login_em: null,
	ultimo_ip: null,
	updated_at: string;
	created_at: string;
	deleted_at: null
}

export interface EditarUsuarioResponse {
  id: string;
	grupo_id: string;
	nome: string;
	email: string;
	status: string;
	avatar: null;
	google2fa_enable: boolean,
	google2fa_confirmado_em: null,
	ultimo_login_em: null,
	ultimo_ip: null,
	updated_at: string;
	created_at: string;
	deleted_at: null
}

export type ListarUsuariosResponse = LaravelResourcePagination<Usuario>;

export type AtivarUsuarioResponse = Usuario;
export type VisualizarUsuarioResponse = Usuario;



