import { LaravelApiResponse } from "@/types/laravel";

import { proxyPrivateRequest } from "@/lib/proxy-private";

import { toUsuarioSessao } from "../mappers/usuarioSessao.mapper";
import { UsuarioSessoes } from "../types/usuarioSessoes.model";
import { EncerrarSessaoResponse, ListarUsuarioSessoesResponse } from "../types/usuarioSessoes.response";


export async function listarUsuarioSessoes(): Promise<LaravelApiResponse<UsuarioSessoes[]>> {
  const response = await proxyPrivateRequest<ListarUsuarioSessoesResponse>({
    url: `/perfil/sessoes`,
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
  const response = await proxyPrivateRequest<EncerrarSessaoResponse>({
    url: `/perfil/sessoes/${sessionId}/encerrar`,
    method: "DELETE",
  });

  return response.data;
}