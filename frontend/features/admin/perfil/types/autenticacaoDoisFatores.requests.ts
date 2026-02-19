export interface Habilitar2FARequest {
  senha: string;
}

export interface Confirmar2FARequest {
  codigo: string;
}

export interface Desabilitar2FARequest {
  senha: string;
  codigo: string;
}