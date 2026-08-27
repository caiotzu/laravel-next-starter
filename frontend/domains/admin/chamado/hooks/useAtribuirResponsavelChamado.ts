"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { ApiErrorResponse } from "@/types/errors";

import { atribuirResponsavelChamado } from "../services/chamadoService";

export function useAtribuirResponsavelChamado(chamadoId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    Awaited<ReturnType<typeof atribuirResponsavelChamado>>,
    AxiosError<ApiErrorResponse>,
    string | null
  >({
    mutationFn: (responsavelId) =>
      atribuirResponsavelChamado(chamadoId, { responsavel_id: responsavelId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chamado-admin", chamadoId] });
      queryClient.invalidateQueries({ queryKey: ["chamados-admin"] });
    },
  });
}
