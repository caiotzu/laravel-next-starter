import { proxyPrivateRequest } from "@/lib/proxy-private";

import { AtualizarRequest, AtualizarAvatarRequest, AtualizarSenhaRequest } from "../types/usuario.requests";
import { AtualizarResponse, AtualizarAvatarResponse, AtualizarSenhaResponse } from "../types/usuario.responses";

export async function atualizarAvatar(
  payload: AtualizarAvatarRequest
): Promise<AtualizarAvatarResponse> {
  const response = await proxyPrivateRequest<AtualizarAvatarResponse>({
    url: "/perfil/avatar",
    method: "PATCH",
    data: payload,
  });
  return response.data;
}

export async function atualizar(
  payload: AtualizarRequest
): Promise<AtualizarResponse> {
  const response = await proxyPrivateRequest<AtualizarResponse>({
    url: "/perfil",
    method: "PATCH",
    data: payload,
  });
  return response.data
}

export async function atualizarSenha(
  payload: AtualizarSenhaRequest
): Promise<AtualizarSenhaResponse> {
  const response = await proxyPrivateRequest<AtualizarSenhaResponse>({
    url: "/perfil/senha",
    method: "PATCH",
    data: payload,
  });
  return response.data
}
