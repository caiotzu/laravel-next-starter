"use client";

import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { ApiErrorResponse } from "@/types/errors";

import { listarAcessosSuporteRecebidos } from "../services/acessoSuporteService";
import { AcessoSuporte } from "../types/acessoSuporte.model";

export function useAcessosSuporteRecebidos() {
  return useQuery<AcessoSuporte[], AxiosError<ApiErrorResponse>>({
    queryKey: ["acessosSuporteRecebidos"],
    queryFn: listarAcessosSuporteRecebidos,
    refetchInterval: (query) => {
      const temAtivo = query.state.data?.some((a) => a.ativo);
      return temAtivo ? 15_000 : false;
    },
  });
}
