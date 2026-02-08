"use client";

import { useQuery } from "@tanstack/react-query";

import { visualizarGrupoEmpresa } from "../services/grupoEmpresaService";

export function useGrupoEmpresa(id: string) {
  return useQuery({
    queryKey: ["grupo-empresa", id],
    queryFn: ({ queryKey }) => {
      const [, grupoId] = queryKey;
      return visualizarGrupoEmpresa(grupoId as string);
    },
    enabled: !!id,
  });
}
