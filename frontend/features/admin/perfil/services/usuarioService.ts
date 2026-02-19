import { proxyAdminRequest } from "@/lib/proxy-admin";

import { AtualizarRequest, AtualizarAvatarRequest, AtualizarSenhaRequest } from "../types/usario.requests";
import { AtualizarResponse, AtualizarAvatarResponse, AtualizarSenhaResponse } from "../types/usuario.responses";

export function atualizarAvatar(
  payload: AtualizarAvatarRequest
): Promise<AtualizarAvatarResponse> {
  return proxyAdminRequest<AtualizarAvatarResponse>({
    url: "/admin/perfil/avatar",
    method: "PATCH",
    data: payload,
  });
}

export function atualizar(
  payload: AtualizarRequest
): Promise<AtualizarResponse> {
  return proxyAdminRequest<AtualizarResponse>({
    url: "/admin/perfil",
    method: "PATCH",
    data: payload,
  });
}

export function atualizarSenha(
  payload: AtualizarSenhaRequest
): Promise<AtualizarSenhaResponse> {
  return proxyAdminRequest<AtualizarSenhaResponse>({
    url: "/admin/perfil/senha",
    method: "PATCH",
    data: payload,
  });
}

