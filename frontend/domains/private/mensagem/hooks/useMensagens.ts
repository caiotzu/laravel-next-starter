"use client";

import { useQuery } from "@tanstack/react-query";

import { listarMensagens } from "../services/mensagemService";
import { ListarMensagensRequest } from "../types/mensagem.requests";

export function useMensagens(
  params?: ListarMensagensRequest,
  enabled: boolean = true
) {
  const safeParams = params ?? {};
  return useQuery({
    queryKey: ["mensagens-private", safeParams],
    queryFn: ({ queryKey }) => {
      const [, queryParams] = queryKey;
      return listarMensagens(
        queryParams as ListarMensagensRequest
      );
    },
    placeholderData: (previousData) => previousData,
    enabled,
  });
}
