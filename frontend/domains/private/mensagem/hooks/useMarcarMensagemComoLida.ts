"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { marcarMensagemComoLida } from "../services/mensagemService";

export function useMarcarMensagemComoLida() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: marcarMensagemComoLida,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mensagens-private"] });
      queryClient.invalidateQueries({ queryKey: ["mensagens-private-contador-nao-lidas"] });
    },
  });
}
