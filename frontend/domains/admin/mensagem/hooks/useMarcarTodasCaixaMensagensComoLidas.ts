"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { marcarTodasCaixaMensagensComoLidas } from "../services/caixaMensagemService";

export function useMarcarTodasCaixaMensagensComoLidas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: marcarTodasCaixaMensagensComoLidas,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mensagens-caixa-admin"] });
      queryClient.invalidateQueries({ queryKey: ["mensagens-caixa-admin-contador-nao-lidas"] });
    },
  });
}
