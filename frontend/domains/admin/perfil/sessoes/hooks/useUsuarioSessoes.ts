"use client";

import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { ApiErrorResponse } from "@/types/errors";
import { LaravelApiResponse } from "@/types/laravel";

import { listarUsuarioSessoes } from "../services/usuarioSessaoService";
import { UsuarioSessoes } from "../types/usuarioSessoes.model";

export function useUsuarioSessoes() {
  return useQuery<LaravelApiResponse<UsuarioSessoes[]>, AxiosError<ApiErrorResponse>>({
    queryKey: ["usuarioSessoes"],
    queryFn: listarUsuarioSessoes
  });
}
