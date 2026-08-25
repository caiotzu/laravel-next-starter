import qs from "qs";

import { proxyAdminRequest } from "@/lib/proxy-admin";

import { toChamado } from "../mappers/chamado.mapper";
import {
  AtribuirResponsavelRequest,
  AtualizarStatusRequest,
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

  const response = await proxyAdminRequest<ListarChamadosResponse>({
    url: `/admin/chamados?${query}`,
    method: "GET",
  });

  return {
    ...response.data,
    data: response.data.data.map(toChamado),
  };
}

export async function visualizarChamado(id: string) {
  const response = await proxyAdminRequest<{ data: ChamadoDataResponse }>({
    url: `/admin/chamados/${id}`,
    method: "GET",
  });

  return toChamado(response.data.data);
}

export async function responderChamado(id: string, payload: ResponderChamadoRequest) {
  const response = await proxyAdminRequest<{ data: ChamadoMensagemDataResponse }>({
    url: `/admin/chamados/${id}/mensagens`,
    method: "POST",
    data: payload,
  });

  return response.data.data;
}

export async function atualizarStatusChamado(id: string, payload: AtualizarStatusRequest) {
  const response = await proxyAdminRequest<{ data: ChamadoDataResponse }>({
    url: `/admin/chamados/${id}/status`,
    method: "PATCH",
    data: payload,
  });

  return toChamado(response.data.data);
}

export async function atribuirResponsavelChamado(id: string, payload: AtribuirResponsavelRequest) {
  const response = await proxyAdminRequest<{ data: ChamadoDataResponse }>({
    url: `/admin/chamados/${id}/responsavel`,
    method: "PATCH",
    data: payload,
  });

  return toChamado(response.data.data);
}
