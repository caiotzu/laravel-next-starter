export interface AtualizarAvatarRequest {
  avatar: string;
}

export interface AtualizarRequest {
  nome: string;
  email: string;
}

export interface AtualizarSenhaRequest {
  senha_atual: string;
  senha_nova: string;
  senha_nova_confirma: string;
}

