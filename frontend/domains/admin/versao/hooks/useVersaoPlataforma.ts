"use client";

import { useQuery } from "@tanstack/react-query";

import { proxyAdminRequest } from "@/lib/proxy-admin";

interface VersaoResponse {
  data: {
    version: string;
  };
}

/**
 * Mesmo padrão do Private (ver domains/private/versao/hooks/
 * useVersaoPlataforma.ts): GET /version não exige autenticação no backend,
 * mas reaproveita o proxy Admin já existente.
 */
export function useVersaoPlataforma() {
  return useQuery({
    queryKey: ["versao-plataforma"],
    queryFn: async () => {
      const response = await proxyAdminRequest<VersaoResponse>({
        url: "/version",
        method: "GET",
      });

      return response.data.data.version;
    },
    staleTime: 5 * 60 * 1000,
  });
}
