export interface AtualizarAvatarRequest {
  avatar: string;
}

export interface AtualizarRequest {
  nome: string;
  email: string;
  /** Obrigatória pelo backend quando o e-mail é alterado (reautenticação). */
  senha_atual?: string;
}

export interface AtualizarSenhaRequest {
  senha_atual: string;
  senha_nova: string;
  senha_nova_confirma: string;
}

