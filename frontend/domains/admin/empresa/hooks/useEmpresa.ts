"use client";

import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { ApiErrorResponse } from "@/types/errors";

import { visualizarEmpresa } from "../services/empresaService";
import { VisualizarEmpresaResponse } from "../types/empresa.responses";

export function useEmpresa(id: string) {
  return useQuery<VisualizarEmpresaResponse, AxiosError<ApiErrorResponse>>({
    queryKey: ["empresa", id],
    queryFn: ({ queryKey }) => {
      const [, empresaId] = queryKey;
      return visualizarEmpresa(empresaId as string);
    },
    enabled: !!id,
  });
}
