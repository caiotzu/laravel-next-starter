"use client";

import { useQuery } from "@tanstack/react-query";

import { contarMensagensNaoLidas } from "../services/mensagemService";

export function useContadorMensagensNaoLidas() {
  return useQuery({
    queryKey: ["mensagens-private-contador-nao-lidas"],
    queryFn: contarMensagensNaoLidas,
    // Mantém o indicador do sino relativamente atualizado sem depender de
    // WebSocket/infra de tempo real (fora do escopo desta etapa).
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
