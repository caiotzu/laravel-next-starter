import { proxyAdminRequest } from "@/lib/proxy-admin";

import { AtualizarRequest, AtualizarAvatarRequest, AtualizarSenhaRequest } from "../types/usuario.requests";
import { AtualizarResponse, AtualizarAvatarResponse, AtualizarSenhaResponse } from "../types/usuario.responses";

export async function atualizarAvatar(
  payload: AtualizarAvatarRequest
): Promise<AtualizarAvatarResponse> {
  const response = await proxyAdminRequest<AtualizarAvatarResponse>({
    url: "/admin/perfil/avatar",
    method: "PATCH",
    data: payload,
  });
  return response.data;
}

export async function atualizar(
  payload: AtualizarRequest
): Promise<AtualizarResponse> {
  const response = await proxyAdminRequest<AtualizarResponse>({
    url: "/admin/perfil",
    method: "PATCH",
    data: payload,
  });
  return response.data
}

export async function atualizarSenha(
  payload: AtualizarSenhaRequest
): Promise<AtualizarSenhaResponse> {
  const response = await proxyAdminRequest<AtualizarSenhaResponse>({
    url: "/admin/perfil/senha",
    method: "PATCH",
    data: payload,
  });
  return response.data
}
