"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { marcarTodasMensagensComoLidas } from "../services/mensagemService";

export function useMarcarTodasMensagensComoLidas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: marcarTodasMensagensComoLidas,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mensagens-private"] });
      queryClient.invalidateQueries({ queryKey: ["mensagens-private-contador-nao-lidas"] });
    },
  });
}
