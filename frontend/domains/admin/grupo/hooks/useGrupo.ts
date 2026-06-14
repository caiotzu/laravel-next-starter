"use client";

import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { ApiErrorResponse } from "@/types/errors";

import { visualizarGrupo } from "../services/grupoService";
import { Grupo } from "../types/grupo.model";

export function useGrupo(id: string) {
  return useQuery<Grupo, AxiosError<ApiErrorResponse>>({
    queryKey: ["grupo", id],
    queryFn: ({ queryKey }) => {
      const [, grupoId] = queryKey;
      return visualizarGrupo(grupoId as string);
    },
    enabled: !!id,
  });
}
