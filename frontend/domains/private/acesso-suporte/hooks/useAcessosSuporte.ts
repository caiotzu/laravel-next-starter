"use client";

import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { ApiErrorResponse } from "@/types/errors";

import { listarAcessosSuporte } from "../services/acessoSuporteService";
import { ListarAcessosSuporteRequest } from "../types/acessoSuporte.requests";

export function useAcessosSuporte(params?: ListarAcessosSuporteRequest) {
  const safeParams = params ?? {};

  return useQuery<
    Awaited<ReturnType<typeof listarAcessosSuporte>>,
    AxiosError<ApiErrorResponse>
  >({
    queryKey: ["acessosSuporte", safeParams],
    queryFn: ({ queryKey }) => {
      const [, queryParams] = queryKey;
      return listarAcessosSuporte(queryParams as ListarAcessosSuporteRequest);
    },
    placeholderData: (previousData) => previousData,
    // Enquanto houver um acesso ativo na página atual, o status pode mudar
    // sozinho (expirar) sem nenhuma ação do usuário — atualiza sozinho.
    refetchInterval: (query) => {
      const temAtivo = query.state.data?.data.some((a) => a.ativo);
      return temAtivo ? 15_000 : false;
    },
  });
}
