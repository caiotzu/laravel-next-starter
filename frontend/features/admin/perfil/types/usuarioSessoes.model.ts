export interface UsuarioSessoes {
  id: string;
  usuario_id: string;
  ip: string | null;
  browser: string | null;
  plataforma: string | null;
  dispositivo: string | null;
  ativo: boolean;
  ultimo_acesso_em: string | null;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
}
