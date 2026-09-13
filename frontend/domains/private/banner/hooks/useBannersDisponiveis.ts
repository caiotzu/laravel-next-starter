"use client";

import { useQuery } from "@tanstack/react-query";

import { listarBannersDisponiveis } from "../services/bannerService";

/**
 * Busca os banners elegíveis uma única vez por sessão de navegação — sem
 * polling e sem refetch a cada foco de janela/troca de rota. `staleTime`
 * longo é intencional: um novo banner cadastrado pelo Admin não precisa
 * aparecer em tempo real para quem já está logado, só no próximo acesso
 * "fresco" (perde o cache ao fechar a aba, já que fica só em memória —
 * ver BannerProvider, que monta esta query uma única vez no layout
 * persistente do Private, do mesmo jeito que
 * MensagemContadorProvider/useContadorMensagensNaoLidas fazem para o
 * contador de mensagens).
 */
export function useBannersDisponiveis(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["banners-private-disponiveis"],
    queryFn: listarBannersDisponiveis,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: options?.enabled ?? true,
  });
}
