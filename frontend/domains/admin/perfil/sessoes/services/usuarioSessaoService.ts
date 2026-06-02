import { LaravelApiResponse } from "@/types/laravel";

import { proxyAdminRequest } from "@/lib/proxy-admin";

import { toUsuarioSessao } from "../mappers/usuarioSessao.mapper";
import { UsuarioSessoes } from "../types/usuarioSessoes.model";
import { EncerrarSessaoResponse, ListarUsuarioSessoesResponse } from "../types/usuarioSessoes.response";


export async function listarUsuarioSessoes(): Promise<LaravelApiResponse<UsuarioSessoes[]>> {
  const response = await proxyAdminRequest<ListarUsuarioSessoesResponse>({
    url: `/admin/perfil/sessoes`,
    method: "GET",
  });

  return {
    ...response.data,
    data: response.data.data.map(
      toUsuarioSessao
    ),
  };
}

export async function encerrarUsuarioSessao(sessionId: string): Promise<EncerrarSessaoResponse> {
  const response = await proxyAdminRequest<EncerrarSessaoResponse>({
    url: `/admin/perfil/sessoes/${sessionId}/encerrar`,
    method: "DELETE",
  });

  return response.data;
}