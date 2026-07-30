"use client";

import { useQuery } from "@tanstack/react-query";

import { listarGrupos } from "../services/grupoService";
import { ListarGruposRequest } from "../types/grupo.requests";


export function useGrupos(
  params?: ListarGruposRequest
) {
  const safeParams = params ?? {};
  return useQuery({
    queryKey: ["grupos", safeParams],
    queryFn: ({ queryKey }) => {
      const [, queryParams] = queryKey;
      return listarGrupos(
        queryParams as ListarGruposRequest
      );
    },
    placeholderData: (previousData) => previousData
  });
}