"use client";

import { useQuery } from "@tanstack/react-query";

import { listarPermissoes } from "../services/permissaoService";

export function usePermissoes() {
  return useQuery({
    queryKey: ["permissoes"],
    queryFn: () => {
      return listarPermissoes();
    },
    placeholderData: (previousData) => previousData
  });
}