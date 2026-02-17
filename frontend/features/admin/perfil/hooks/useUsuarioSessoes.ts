"use client";

import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { ApiErrorResponse } from "@/types/errors";

import { listarUsuarioSessoes } from "../services/usuarioSessaoService";
import { UsuarioSessoes } from "../types/usuarioSessoes.model";

export function useUsuarioSessoes() {
  return useQuery<UsuarioSessoes[], AxiosError<ApiErrorResponse>>({
    queryKey: ["usuarioSessoes"],
    queryFn: listarUsuarioSessoes
  });
}
