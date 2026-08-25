"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { ApiErrorResponse } from "@/types/errors";

import { abrirChamado } from "../services/chamadoService";
import { AbrirChamadoRequest } from "../types/chamado.requests";

export function useAbrirChamado() {
  const queryClient = useQueryClient();

  return useMutation<
    Awaited<ReturnType<typeof abrirChamado>>,
    AxiosError<ApiErrorResponse>,
    AbrirChamadoRequest
  >({
    mutationFn: (payload) => abrirChamado(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chamados-private"] });
    },
  });
}
