"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { marcarCaixaMensagemComoLida } from "../services/caixaMensagemService";

export function useMarcarCaixaMensagemComoLida() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: marcarCaixaMensagemComoLida,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mensagens-caixa-admin"] });
      queryClient.invalidateQueries({ queryKey: ["mensagens-caixa-admin-contador-nao-lidas"] });
    },
  });
}
