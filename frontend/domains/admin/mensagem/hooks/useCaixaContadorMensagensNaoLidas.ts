"use client";

import { useQuery } from "@tanstack/react-query";

import { contarCaixaMensagensNaoLidas } from "../services/caixaMensagemService";

export function useCaixaContadorMensagensNaoLidas(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["mensagens-caixa-admin-contador-nao-lidas"],
    queryFn: contarCaixaMensagensNaoLidas,
    // Mantém o indicador do sino relativamente atualizado sem depender de
    // WebSocket/infra de tempo real (fora do escopo desta etapa).
    refetchInterval: 60_000,
    staleTime: 30_000,
    enabled: options?.enabled ?? true,
  });
}
