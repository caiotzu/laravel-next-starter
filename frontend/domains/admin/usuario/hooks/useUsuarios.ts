"use client";

import { useQuery } from "@tanstack/react-query";

import { listarUsuarios } from "../services/usuarioService";
import { ListarUsuariosRequest } from "../types/usuario.requests";

export function useUsuarios(
  params?: ListarUsuariosRequest
) {
  const safeParams = params ?? {};
  return useQuery({
    queryKey: ["usuarios", safeParams],
    queryFn: ({ queryKey }) => {
      const [, queryParams] = queryKey;
      return listarUsuarios(
        queryParams as ListarUsuariosRequest
      );
    },
    placeholderData: (previousData) => previousData
  });
}