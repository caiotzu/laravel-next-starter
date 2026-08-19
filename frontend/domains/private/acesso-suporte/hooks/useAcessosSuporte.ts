"use client";

import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { ApiErrorResponse } from "@/types/errors";

import { listarAcessosSuporte } from "../services/acessoSuporteService";
import { AcessoSuporte } from "../types/acessoSuporte.model";

export function useAcessosSuporte() {
  return useQuery<AcessoSuporte[], AxiosError<ApiErrorResponse>>({
    queryKey: ["acessosSuporte"],
    queryFn: listarAcessosSuporte,
    // Enquanto houver um acesso ativo na lista, o status pode mudar
    // sozinho (expirar) sem nenhuma ação do usuário — atualiza sozinho.
    refetchInterval: (query) => {
      const temAtivo = query.state.data?.some((a) => a.ativo);
      return temAtivo ? 15_000 : false;
    },
  });
}
