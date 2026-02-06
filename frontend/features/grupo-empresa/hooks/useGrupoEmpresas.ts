"use client";

import { useQuery } from "@tanstack/react-query";
import { listarGrupoEmpresas } from "../services/grupoEmpresaService";
import { ListarGrupoEmpresasRequest } from "../types";

export function useGrupoEmpresas(
  params?: ListarGrupoEmpresasRequest
) {
  const safeParams = params ?? {};
  return useQuery({
    queryKey: ["grupo-empresas", safeParams],
    queryFn: ({ queryKey }) => {
      const [, queryParams] = queryKey;
      return listarGrupoEmpresas(
        queryParams as ListarGrupoEmpresasRequest
      );
    },
    placeholderData: (previousData) => previousData,
  });
}