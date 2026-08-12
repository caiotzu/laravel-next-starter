import qs from "qs";

import { proxyPrivateRequest } from "@/lib/proxy-private";

import { toMensagem } from "../mappers/mensagem.mapper";
import { ListarMensagensRequest } from "../types/mensagem.requests";
import {
  ContadorNaoLidasResponse,
  ListarMensagensResponse,
  MarcarComoLidaResponse,
} from "../types/mensagem.responses";

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

  const response = await proxyPrivateRequest<ListarMensagensResponse>({
    url: `/mensagens?${query}`,
    method: "GET",
  });

  return {
    ...response.data,
    data: response.data.data.map(
      toMensagem
    ),
  };
}

export async function marcarMensagemComoLida(mensagemId: string) {
  const response = await proxyPrivateRequest<MarcarComoLidaResponse>({
    url: `/mensagens/${mensagemId}/marcar-lida`,
    method: "PATCH",
  });

  return toMensagem(response.data.data);
}

export async function marcarTodasMensagensComoLidas() {
  return proxyPrivateRequest<null>({
    url: "/mensagens/marcar-todas-lidas",
    method: "PATCH",
  });
}

export async function contarMensagensNaoLidas() {
  const response = await proxyPrivateRequest<ContadorNaoLidasResponse>({
    url: "/mensagens/nao-lidas/contador",
    method: "GET",
  });

  return response.data.data.total_nao_lidas;
}
