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
    queryKey: ["chamado-private", id],
    queryFn: () => visualizarChamado(id),
    enabled: !!id,
    // Mesma ideia do contador de mensagens não lidas: sem WebSocket ainda,
    // um polling leve mantém a conversa razoavelmente atualizada enquanto
    // a tela está aberta.
    refetchInterval: 20_000,
  });
}
