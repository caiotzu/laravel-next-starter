"use client";

import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { ApiErrorResponse } from "@/types/errors";

import { visualizarChamado } from "../services/chamadoService";

export function useChamado(id: string) {
  return useQuery<
    Awaited<ReturnType<typeof visualizarChamado>>,
    AxiosError<ApiErrorResponse>
  >({
    queryKey: ["chamado-admin", id],
    queryFn: () => visualizarChamado(id),
    enabled: !!id,
    refetchInterval: 20_000,
  });
}
