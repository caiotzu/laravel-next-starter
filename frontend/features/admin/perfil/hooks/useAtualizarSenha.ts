"use client";

import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { ApiErrorResponse } from "@/types/errors";

import { atualizarSenha } from "../services/usuarioService";
import { AtualizarSenhaRequest } from "../types/usario.requests";
import { AtualizarSenhaResponse } from "../types/usuario.responses";

export function useAtualizarSenhaPerfil() {

  return useMutation<
    AtualizarSenhaResponse,
    AxiosError<ApiErrorResponse>,
    AtualizarSenhaRequest
  >({
    mutationFn: atualizarSenha,
  });
}
