"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { ApiErrorResponse } from "@/types/errors";

import { encerrarUsuarioSessao } from "../services/usuarioSessaoService";
import { EncerrarSessaoResponse } from "../types/usuarioSessoes.response";

export function useEncerrarSessao() {
  const queryClient = useQueryClient();

  return useMutation<
    EncerrarSessaoResponse, 
    AxiosError<ApiErrorResponse>, 
    string
  >({
    mutationFn: (sessionId) => encerrarUsuarioSessao(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["usuarioSessoes"] });
    },
  });
}