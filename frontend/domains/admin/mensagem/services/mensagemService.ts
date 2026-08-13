import qs from "qs";

import { proxyAdminRequest } from "@/lib/proxy-admin";

import { toMensagem } from "../mappers/mensagem.mapper";
import { BuscarUsuariosMensagemRequest, CadastrarMensagemRequest, ListarMensagensRequest } from "../types/mensagem.requests";
import { BuscarUsuariosMensagemResponse, CadastrarMensagemResponse, ListarMensagensResponse, VisualizarMensagemResponse } from "../types/mensagem.responses";

export async function cadastrarMensagem(
  dto: CadastrarMensagemRequest
) {
  const response =
    await proxyAdminRequest<CadastrarMensagemResponse>({
      url: "/admin/mensagens",
      method: "POST",
      data: dto,
    });

  return toMensagem(response.data.data);
}

export async function listarMensagens(
  dto: ListarMensagensRequest
) {
  const query = qs.stringify(dto, {
    skipNulls: true,
    filter: (_, value) => {
      if (
        value === "" ||
        value === undefined
      ) {
        return undefined;
      }

      return value;
    },
  });

  const response = await proxyAdminRequest<ListarMensagensResponse>({
    url: `/admin/mensagens?${query}`,
    method: "GET",
  });

  return {
    ...response.data,
    data: response.data.data.map(
      toMensagem
    ),
  };
}

export async function visualizarMensagem(id: string) {
  const response = await proxyAdminRequest<VisualizarMensagemResponse>({
    url: `/admin/mensagens/${id}`,
    method: "GET",
  });

  return toMensagem(response.data.data);
}

/**
 * Busca usuários em TODO o sistema (não escopado pela entidade/grupo do
 * admin autenticado), usada exclusivamente no autocomplete de destinatário
 * individual do cadastro de mensagem.
 */
export async function buscarUsuariosMensagem(
  dto: BuscarUsuariosMensagemRequest
) {
  const query = qs.stringify(dto, {
    skipNulls: true,
    filter: (_, value) => {
      if (
        value === "" ||
        value === undefined
      ) {
        return undefined;
      }

      return value;
    },
  });

  const response = await proxyAdminRequest<BuscarUsuariosMensagemResponse>({
    url: `/admin/mensagens/usuarios?${query}`,
    method: "GET",
  });

  return response.data;
}
