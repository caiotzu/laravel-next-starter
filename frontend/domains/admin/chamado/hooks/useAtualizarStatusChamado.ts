"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { ApiErrorResponse } from "@/types/errors";

import { ChamadoStatus } from "@/constants/chamado-status";

import { atualizarStatusChamado } from "../services/chamadoService";

export function useAtualizarStatusChamado(chamadoId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    Awaited<ReturnType<typeof atualizarStatusChamado>>,
    AxiosError<ApiErrorResponse>,
    ChamadoStatus
  >({
    mutationFn: (status) => atualizarStatusChamado(chamadoId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chamado-admin", chamadoId] });
      queryClient.invalidateQueries({ queryKey: ["chamados-admin"] });
    },
  });
}
