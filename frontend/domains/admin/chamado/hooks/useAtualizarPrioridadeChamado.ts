"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { ApiErrorResponse } from "@/types/errors";

import { ChamadoPrioridade } from "@/constants/chamado-prioridade";

import { atualizarPrioridadeChamado } from "../services/chamadoService";

export function useAtualizarPrioridadeChamado(chamadoId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    Awaited<ReturnType<typeof atualizarPrioridadeChamado>>,
    AxiosError<ApiErrorResponse>,
    ChamadoPrioridade
  >({
    mutationFn: (prioridade) => atualizarPrioridadeChamado(chamadoId, { prioridade }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chamado-admin", chamadoId] });
      queryClient.invalidateQueries({ queryKey: ["chamados-admin"] });
    },
  });
}
