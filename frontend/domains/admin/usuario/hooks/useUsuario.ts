"use client";

import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { ApiErrorResponse } from "@/types/errors";

import { visualizarUsuario } from "../services/usuarioService";
import { Usuario } from "../types/usuario.model";

export function useUsuario(id: string) {
  return useQuery<Usuario, AxiosError<ApiErrorResponse>>({
    queryKey: ["usuario", id],
    queryFn: ({ queryKey }) => {
      const [, usuarioId] = queryKey;
      return visualizarUsuario(usuarioId as string);
    },
    enabled: !!id,
  });
}
