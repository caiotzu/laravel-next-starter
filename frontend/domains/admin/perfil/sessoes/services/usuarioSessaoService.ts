import { proxyAdminRequest } from "@/lib/proxy-admin";

import { UsuarioSessoes } from "../types/usuarioSessoes.model";
import { EncerrarSessaoResponse } from "../types/usuarioSessoes.response";

export function listarUsuarioSessoes() {
  return proxyAdminRequest<UsuarioSessoes[]>({
    url: `/admin/perfil/sessoes`,
    method: "GET",
  });
}

export function encerrarUsuarioSessao(sessionId: string) {
  return proxyAdminRequest<EncerrarSessaoResponse>({
    url: `/admin/perfil/sessoes/${sessionId}/encerrar`,
    method: "DELETE",
  });
}
