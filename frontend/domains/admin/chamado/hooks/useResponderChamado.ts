"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { ApiErrorResponse } from "@/types/errors";

import { responderChamado } from "../services/chamadoService";
import { ResponderChamadoRequest } from "../types/chamado.requests";

export function useResponderChamado(chamadoId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    Awaited<ReturnType<typeof responderChamado>>,
    AxiosError<ApiErrorResponse>,
    ResponderChamadoRequest
  >({
    mutationFn: (payload) => responderChamado(chamadoId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chamado-admin", chamadoId] });
      queryClient.invalidateQueries({ queryKey: ["chamados-admin"] });
    },
  });
}
