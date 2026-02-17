export interface Usuario {
  id: string;
  nome: string;
  email: string;
  avatar: string | null;
  grupo: string;
  ativo: boolean;
  google2fa_enable: boolean;
  google2fa_confirmado_em: string | null;
  ultimo_login_em: string | null;
  ultimo_ip: string | null;
  permissoes: string[];
}
