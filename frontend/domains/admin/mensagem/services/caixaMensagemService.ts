import qs from "qs";

import { proxyAdminRequest } from "@/lib/proxy-admin";

import { toCaixaMensagem } from "../mappers/caixaMensagem.mapper";
import { ListarCaixaMensagensRequest } from "../types/caixaMensagem.requests";
import {
  CaixaContadorNaoLidasResponse,
  ListarCaixaMensagensResponse,
  MarcarCaixaMensagemComoLidaResponse,
} from "../types/caixaMensagem.responses";

/**
 * A caixa de mensagens (leitura das mensagens recebidas) não tem rotas
 * próprias no contexto Admin: o backend já expõe esses endpoints de forma
 * genérica (qualquer usuário autenticado, seja Admin ou Private), então
 * este service reaproveita exatamente as mesmas rotas usadas pelo domínio
 * Private, só que autenticado com o token do Admin.
 */

export async function listarCaixaMensagens(
  dto: ListarCaixaMensagensRequest
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

  const response = await proxyAdminRequest<ListarCaixaMensagensResponse>({
    url: `/mensagens?${query}`,
    method: "GET",
  });

  return {
    ...response.data,
    data: response.data.data.map(
      toCaixaMensagem
    ),
  };
}

export async function marcarCaixaMensagemComoLida(mensagemId: string) {
  const response = await proxyAdminRequest<MarcarCaixaMensagemComoLidaResponse>({
    url: `/mensagens/${mensagemId}/marcar-lida`,
    method: "PATCH",
  });

  return toCaixaMensagem(response.data.data);
}

export async function marcarTodasCaixaMensagensComoLidas() {
  return proxyAdminRequest<null>({
    url: "/mensagens/marcar-todas-lidas",
    method: "PATCH",
  });
}

export async function contarCaixaMensagensNaoLidas() {
  const response = await proxyAdminRequest<CaixaContadorNaoLidasResponse>({
    url: "/mensagens/nao-lidas/contador",
    method: "GET",
  });

  return response.data.data.total_nao_lidas;
}
