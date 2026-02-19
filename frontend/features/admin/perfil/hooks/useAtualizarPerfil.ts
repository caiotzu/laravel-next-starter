"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { ApiErrorResponse } from "@/types/errors";

import { atualizar } from "../services/usuarioService";
import { AtualizarRequest } from "../types/usario.requests";
import { AtualizarResponse } from "../types/usuario.responses";

export function useAtualizarPerfil() {
  const queryClient = useQueryClient();

  return useMutation<
    AtualizarResponse,
    AxiosError<ApiErrorResponse>,
    AtualizarRequest
  >({
    mutationFn: atualizar,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["userAdmin"] });
      queryClient.invalidateQueries({ queryKey: ["usuarioSessoes"] });
    },
  });
}
