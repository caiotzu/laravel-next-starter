"use client";

import { useQuery } from "@tanstack/react-query";

import { listarAuditorias } from "../services/auditoriaService";
import { ListarAuditoriasRequest } from "../types/auditoria.requests";

export function useAuditorias(
  params?: ListarAuditoriasRequest
) {
  const safeParams = params ?? {};
  return useQuery({
    queryKey: ["auditorias", safeParams],
    queryFn: ({ queryKey }) => {
      const [, queryParams] = queryKey;
      return listarAuditorias(
        queryParams as ListarAuditoriasRequest
      );
    },
    placeholderData: (previousData) => previousData
  });
}
