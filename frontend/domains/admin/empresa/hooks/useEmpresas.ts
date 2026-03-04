"use client";

import { useQuery } from "@tanstack/react-query";

import { listarEmpresas } from "../services/empresaService";
import { ListarEmpresasRequest } from "../types/empresa.requests";


export function useEmpresas(
  params?: ListarEmpresasRequest
) {
  const safeParams = params ?? {};
  return useQuery({
    queryKey: ["empresas", safeParams],
    queryFn: ({ queryKey }) => {
      const [, queryParams] = queryKey;
      return listarEmpresas(
        queryParams as ListarEmpresasRequest
      );
    },
    placeholderData: (previousData) => previousData
  });
}
