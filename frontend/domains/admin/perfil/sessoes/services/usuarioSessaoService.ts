import { proxyAdminRequest } from "@/lib/proxy-admin";

import { UsuarioSessoes } from "../types/usuarioSessoes.model";
import { EncerrarSessaoResponse } from "../types/usuarioSessoes.response";


export async function listarUsuarioSessoes(): Promise<UsuarioSessoes[]> {
  const response = await proxyAdminRequest<UsuarioSessoes[]>({
    url: `/admin/perfil/sessoes`,
    method: "GET",
  });

  return response.data;
}

export async function encerrarUsuarioSessao(sessionId: string): Promise<EncerrarSessaoResponse> {
  const response = await proxyAdminRequest<EncerrarSessaoResponse>({
    url: `/admin/perfil/sessoes/${sessionId}/encerrar`,
    method: "DELETE",
  });

  return response.data;
}