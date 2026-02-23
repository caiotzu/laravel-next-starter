import { Usuario } from "@/types/usuario.model";

export interface AtualizarAvatarResponse {
  message: string;
  data: Usuario;
}

export interface AtualizarResponse {
  message: string;
  data: Usuario;
}

export interface AtualizarSenhaResponse {
  message: string;
  data: Usuario;
}