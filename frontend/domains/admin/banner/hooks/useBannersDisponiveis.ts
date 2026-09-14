"use client";

import { useQuery } from "@tanstack/react-query";

import { listarBannersDisponiveis } from "../services/bannerService";

/**
 * Espelha `domains/private/banner/hooks/useBannersDisponiveis.ts` — busca
 * os banners elegíveis para o Admin autenticado uma única vez por sessão
 * de navegação, sem polling nem refetch a cada foco de janela/troca de
 * rota (ver BannerProvider do admin, montado uma única vez no layout).
 */
export function useBannersDisponiveis(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["banners-admin-disponiveis"],
    queryFn: listarBannersDisponiveis,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: options?.enabled ?? true,
  });
}
