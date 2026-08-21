import qs from "qs";

import { proxyPrivateRequest } from "@/lib/proxy-private";

import { toAcessoSuporte } from "../mappers/acessoSuporte.mapper";
import { AcessoSuporte } from "../types/acessoSuporte.model";
import {
  ConcederAcessoSuporteRequest,
  ListarAcessosSuporteRequest,
} from "../types/acessoSuporte.requests";
import {
  ConcederAcessoSuporteResponse,
  ListarAcessosSuporteResponse,
  RevogarAcessoSuporteResponse,
} from "../types/acessoSuporte.responses";

export async function listarAcessosSuporte(params?: ListarAcessosSuporteRequest) {
  const query = qs.stringify(params ?? {}, { skipNulls: true });

  const response = await proxyPrivateRequest<ListarAcessosSuporteResponse>({
    url: `/acessos-suporte?${query}`,
    method: "GET",
  });

  return {
    ...response.data,
    data: response.data.data.map(toAcessoSuporte),
  };
}

export async function concederAcessoSuporte(
  dados: ConcederAcessoSuporteRequest
): Promise<AcessoSuporte> {
  const response = await proxyPrivateRequest<ConcederAcessoSuporteResponse>({
    url: "/acessos-suporte",
    method: "POST",
    data: dados,
  });

  return toAcessoSuporte(response.data.data);
}

export async function revogarAcessoSuporte(id: string): Promise<RevogarAcessoSuporteResponse> {
  const response = await proxyPrivateRequest<RevogarAcessoSuporteResponse>({
    url: `/acessos-suporte/${id}`,
    method: "DELETE",
  });

  return response.data;
}
