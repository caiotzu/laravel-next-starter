"use client";

import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { ApiErrorResponse } from "@/types/errors";

import { visualizarDashboard } from "../services/dashboardService";
import { VisualizarDashboardRequest } from "../types/dashboard.requests";

export function useDashboard(params?: VisualizarDashboardRequest) {
  const safeParams = params ?? {};

  return useQuery<
    Awaited<ReturnType<typeof visualizarDashboard>>,
    AxiosError<ApiErrorResponse>
  >({
    queryKey: ["dashboard-admin", safeParams],
    queryFn: ({ queryKey }) => {
      const [, queryParams] = queryKey;
      return visualizarDashboard(queryParams as VisualizarDashboardRequest);
    },
    placeholderData: (previousData) => previousData,
    // Dados gerenciais não precisam de tempo real — evita refetch
    // excessivo ao trocar de aba/voltar pra tela.
    staleTime: 60_000,
  });
}
