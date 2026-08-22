"use client";

import { useQuery } from "@tanstack/react-query";

import { proxyPrivateRequest } from "@/lib/proxy-private";

interface VersaoResponse {
  data: {
    version: string;
  };
}

/**
 * GET /version não exige autenticação no backend, mas reaproveita o mesmo
 * proxy já usado por todo o resto do Private em vez de criar um novo
 * mecanismo de chamada — evita uma segunda forma de falar com a API só
 * para este endpoint.
 */
export function useVersaoPlataforma() {
  return useQuery({
    queryKey: ["versao-plataforma"],
    queryFn: async () => {
      const response = await proxyPrivateRequest<VersaoResponse>({
        url: "/version",
        method: "GET",
      });

      return response.data.data.version;
    },
    // A versão só muda em deploy — não há necessidade de refetch agressivo.
    staleTime: 5 * 60 * 1000,
  });
}
