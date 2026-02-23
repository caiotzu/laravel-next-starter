export interface Habilitar2FAResponse {
  secret: string;
  otpauth_url: string;
}

export interface Confirmar2FAResponse {
  message: string;
}

export interface Desabilitar2FAResponse {
  message: string;
}