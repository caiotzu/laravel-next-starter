export interface UsuarioSessoes {
  id: string;
  usuarioId: string;
  ip: string | null;
  browser: string | null;
  plataforma: string | null;
  dispositivo: string | null;
  ativo: boolean;
  ultimoAcessoEm: string | null;
  atual: boolean;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
}