"use client";

import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { ApiErrorResponse } from "@/types/errors";

import { listarAcessosSuporteRecebidos } from "../services/acessoSuporteService";
import { ListarAcessosSuporteRequest } from "../types/acessoSuporte.requests";

export function useAcessosSuporteRecebidos(params?: ListarAcessosSuporteRequest) {
  const safeParams = params ?? {};

  return useQuery<
    Awaited<ReturnType<typeof listarAcessosSuporteRecebidos>>,
    AxiosError<ApiErrorResponse>
  >({
    queryKey: ["acessosSuporteRecebidos", safeParams],
    queryFn: ({ queryKey }) => {
      const [, queryParams] = queryKey;
      return listarAcessosSuporteRecebidos(queryParams as ListarAcessosSuporteRequest);
    },
    placeholderData: (previousData) => previousData,
    refetchInterval: (query) => {
      const temAtivo = query.state.data?.data.some((a) => a.ativo);
      return temAtivo ? 15_000 : false;
    },
  });
}
