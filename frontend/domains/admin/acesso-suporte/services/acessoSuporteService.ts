import qs from "qs";

import { proxyAdminRequest } from "@/lib/proxy-admin";

import { toAcessoSuporte } from "../mappers/acessoSuporte.mapper";
import { ListarAcessosSuporteRequest } from "../types/acessoSuporte.requests";
import {
  EncerrarAcessoSuporteResponse,
  ListarAcessosSuporteResponse,
} from "../types/acessoSuporte.responses";

export async function listarAcessosSuporteRecebidos(
  params?: ListarAcessosSuporteRequest
) {
  const query = qs.stringify(params ?? {}, { skipNulls: true });

  const response = await proxyAdminRequest<ListarAcessosSuporteResponse>({
    url: `/admin/acessos-suporte?${query}`,
    method: "GET",
  });

  return {
    ...response.data,
    data: response.data.data.map(toAcessoSuporte),
  };
}

export async function encerrarAcessoSuporte(
  id: string
): Promise<EncerrarAcessoSuporteResponse> {
  const response = await proxyAdminRequest<EncerrarAcessoSuporteResponse>({
    url: `/admin/acessos-suporte/${id}`,
    method: "DELETE",
  });

  return response.data;
}
