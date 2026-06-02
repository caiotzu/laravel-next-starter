import { LaravelApiResponse } from "@/types/laravel";

export interface UsuarioSessaoDataResponse {
  id: string;
	usuario_id: string;
	ip: string | null;
	user_agent: string | null;
	browser: string | null;
	plataforma: string | null;
	dispositivo: string | null;
	ativo: boolean;
	ultimo_acesso_em: string | null;
	logout_em: string | null;
	atual: boolean;
	created_at: string;
	updated_at: string | null;
	deleted_at: string | null;
}

export type ListarUsuarioSessoesResponse = LaravelApiResponse<UsuarioSessaoDataResponse[]>;
export type EncerrarSessaoResponse = void;
