import qs from "qs";

import { proxyAdminRequest } from "@/lib/proxy-admin";

import { UsuarioSessoes } from "../types/usuarioSessoes.model";

export function listarUsuarioSessoes() {
  return proxyAdminRequest<UsuarioSessoes[]>({
    url: `/admin/sessoes`,
    method: "GET",
  });
}

