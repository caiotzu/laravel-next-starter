"use client";

import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { ApiErrorResponse } from "@/types/errors";

import { visualizarEmpresa } from "../services/empresaService";
import { Empresa } from "../types/empresa.model";

export function useEmpresa(id: string) {
  return useQuery<Empresa, AxiosError<ApiErrorResponse>>({
    queryKey: ["empresa", id],
    queryFn: ({ queryKey }) => {
      const [, empresaId] = queryKey;
      return visualizarEmpresa(empresaId as string);
    },
    enabled: !!id,
  });
}
