"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { ApiErrorResponse } from "@/types/errors";

import { encerrarAcessoSuporte } from "../services/acessoSuporteService";

export function useEncerrarAcessoSuporte() {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError<ApiErrorResponse>, string>({
    mutationFn: (id) => encerrarAcessoSuporte(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["acessosSuporteRecebidos"] });
    },
  });
}
