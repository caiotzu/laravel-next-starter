import { LaravelApiResponse } from "@/types/laravel";

export interface TwoFADataResponse {
  secret: string;
  otpauth_url: string;
}

export interface ConfirmarTwoFAResponse {
  message: string;
}

export interface DesabilitarTwoFAResponse {
  message: string;
}

export type Habilitar2FAResponse = LaravelApiResponse<TwoFADataResponse>;
export type Confirmar2FAResponse = LaravelApiResponse<ConfirmarTwoFAResponse>;
export type Desabilitar2FAResponse = LaravelApiResponse<DesabilitarTwoFAResponse>;
