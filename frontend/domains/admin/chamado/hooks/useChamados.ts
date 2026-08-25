"use client";

import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { ApiErrorResponse } from "@/types/errors";

import { listarChamados } from "../services/chamadoService";
import { ListarChamadosRequest } from "../types/chamado.requests";

export function useChamados(params?: ListarChamadosRequest) {
  const safeParams = params ?? {};

  return useQuery<
    Awaited<ReturnType<typeof listarChamados>>,
    AxiosError<ApiErrorResponse>
  >({
    queryKey: ["chamados-admin", safeParams],
    queryFn: ({ queryKey }) => {
      const [, queryParams] = queryKey;
      return listarChamados(queryParams as ListarChamadosRequest);
    },
    placeholderData: (previousData) => previousData,
  });
}
