import { Grupo } from "../../grupo/types/grupo.model";

export interface Usuario {
  id: string;
  grupo_id: string;
  nome: string;
  email: string;
  senha: string;
  status: string;
  remember_token: string;
  avatar: string;
  google2fa_enable: string;
  google2fa_secret: string;
  google2fa_confirmado_em: string;
  ultimo_login_em: string;
  ultimo_ip: string;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;

  // relacionamentos
  grupo?: Grupo
}
