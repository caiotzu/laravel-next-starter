"use client";

import { useQuery } from "@tanstack/react-query";

import { buscarUsuariosMensagem } from "../services/mensagemService";
import { BuscarUsuariosMensagemRequest } from "../types/mensagem.requests";

export function useBuscarUsuariosMensagem(
  params?: BuscarUsuariosMensagemRequest
) {
  const safeParams = params ?? {};
  return useQuery({
    queryKey: ["mensagens-buscar-usuarios", safeParams],
    queryFn: ({ queryKey }) => {
      const [, queryParams] = queryKey;
      return buscarUsuariosMensagem(
        queryParams as BuscarUsuariosMensagemRequest
      );
    },
    placeholderData: (previousData) => previousData,
  });
}
