"use client";

import { useQuery } from "@tanstack/react-query";

import { listarCaixaMensagens } from "../services/caixaMensagemService";
import { ListarCaixaMensagensRequest } from "../types/caixaMensagem.requests";

export function useCaixaMensagens(
  params?: ListarCaixaMensagensRequest,
  enabled: boolean = true
) {
  const safeParams = params ?? {};
  return useQuery({
    queryKey: ["mensagens-caixa-admin", safeParams],
    queryFn: ({ queryKey }) => {
      const [, queryParams] = queryKey;
      return listarCaixaMensagens(
        queryParams as ListarCaixaMensagensRequest
      );
    },
    placeholderData: (previousData) => previousData,
    enabled,
  });
}
