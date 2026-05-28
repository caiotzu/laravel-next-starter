"use client";

import { useQuery } from "@tanstack/react-query";

import { listarUsuarios } from "../services/usuarioService";
import { ListarUsuarioRequest } from "../types/usuario.requests";

export function useUsuarios(
  params?: ListarUsuarioRequest
) {
  const safeParams = params ?? {};
  return useQuery({
    queryKey: ["usuarios", safeParams],
    queryFn: ({ queryKey }) => {
      const [, queryParams] = queryKey;
      return listarUsuarios(
        queryParams as ListarUsuarioRequest
      );
    },
    placeholderData: (previousData) => previousData
  });
}