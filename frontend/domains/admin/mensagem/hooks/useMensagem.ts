"use client";

import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { ApiErrorResponse } from "@/types/errors";

import { visualizarMensagem } from "../services/mensagemService";
import { Mensagem } from "../types/mensagem.model";

export function useMensagem(id: string) {
  return useQuery<Mensagem, AxiosError<ApiErrorResponse>>({
    queryKey: ["mensagem", id],
    queryFn: ({ queryKey }) => {
      const [, mensagemId] = queryKey;
      return visualizarMensagem(mensagemId as string);
    },
    enabled: !!id,
  });
}
