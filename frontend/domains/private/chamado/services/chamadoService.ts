import qs from "qs";

import { proxyPrivateRequest } from "@/lib/proxy-private";

import { toChamado } from "../mappers/chamado.mapper";
import {
  AbrirChamadoRequest,
  ListarChamadosRequest,
  ResponderChamadoRequest,
} from "../types/chamado.requests";
import {
  ChamadoDataResponse,
  ChamadoMensagemDataResponse,
  ListarChamadosResponse,
} from "../types/chamado.responses";

export async function listarChamados(params?: ListarChamadosRequest) {
  const query = qs.stringify(params ?? {}, { skipNulls: true });

  const response = await proxyPrivateRequest<ListarChamadosResponse>({
    url: `/chamados?${query}`,
    method: "GET",
  });

  return {
    ...response.data,
    data: response.data.data.map(toChamado),
  };
}

export async function visualizarChamado(id: string) {
  const response = await proxyPrivateRequest<{ data: ChamadoDataResponse }>({
    url: `/chamados/${id}`,
    method: "GET",
  });

  return toChamado(response.data.data);
}

export async function abrirChamado(payload: AbrirChamadoRequest) {
  const response = await proxyPrivateRequest<{ data: ChamadoDataResponse }>({
    url: "/chamados",
    method: "POST",
    data: payload,
  });

  return toChamado(response.data.data);
}

export async function responderChamado(id: string, payload: ResponderChamadoRequest) {
  const response = await proxyPrivateRequest<{ data: ChamadoMensagemDataResponse }>({
    url: `/chamados/${id}/mensagens`,
    method: "POST",
    data: payload,
  });

  return response.data.data;
}
