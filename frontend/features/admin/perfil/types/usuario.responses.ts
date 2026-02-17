import { Usuario } from "@/types/usuario.model";

export interface AtualizarAvatarResponse {
  message: string;
  data: Usuario;
}