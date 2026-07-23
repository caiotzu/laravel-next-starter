import { proxyPrivateRequest } from "@/lib/proxy-private";

import { Habilitar2FARequest, Confirmar2FARequest, Desabilitar2FARequest } from "../types/autenticacaoDoisFatores.requests";
import { Confirmar2FAResponse, Desabilitar2FAResponse, Habilitar2FAResponse } from "../types/autenticacaoDoisFatores.responses";


export async function habilitar2FA(
    payload: Habilitar2FARequest
): Promise<Habilitar2FAResponse> {
  const response = await proxyPrivateRequest<Habilitar2FAResponse>({
    url: "/2fa/habilitar",
    method: "POST",
    data: payload,
  });

  return response.data;
}

export async function confirmar2FA(
  payload: Confirmar2FARequest
): Promise<Confirmar2FAResponse> {
  const response = await proxyPrivateRequest<Confirmar2FAResponse>({
    url: "/2fa/confirmar",
    method: "POST",
    data: payload,
  });

  return response.data;
}

export async function desabilitar2FA(
  payload: Desabilitar2FARequest
): Promise<Desabilitar2FAResponse> {
  const response = await proxyPrivateRequest<Desabilitar2FAResponse>({
    url: "/2fa/desabilitar",
    method: "DELETE",
    data: payload,
  });

  return response.data;
}
