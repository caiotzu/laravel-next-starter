"use client";

import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { ApiErrorResponse } from "@/types/errors";

import { visualizarGrupoEmpresa } from "../services/grupoEmpresaService";
import { VisualizarGrupoEmpresaResponse } from "../types/grupoEmpresa.responses";


export function useGrupoEmpresa(id: string) {
  return useQuery<VisualizarGrupoEmpresaResponse, AxiosError<ApiErrorResponse>>({
    queryKey: ["grupo-empresa", id],
    queryFn: ({ queryKey }) => {
      const [, grupoId] = queryKey;
      return visualizarGrupoEmpresa(grupoId as string);
    },
    enabled: !!id,
  });
}
