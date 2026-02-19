"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { ApiErrorResponse } from "@/types/errors";

import {
  habilitar2FA,
  confirmar2FA,
  desabilitar2FA,
} from "../services/autenticacaoDoisFatoresService";
import { Confirmar2FARequest, Desabilitar2FARequest, Habilitar2FARequest } from "../types/autenticacaoDoisFatores.requests";
import { Confirmar2FAResponse, Desabilitar2FAResponse, Habilitar2FAResponse } from "../types/autenticacaoDoisFatores.responses";


export function useHabilitar2FA() {
  return useMutation<
    Habilitar2FAResponse,
    AxiosError<ApiErrorResponse>,
    Habilitar2FARequest
  >({
    mutationFn: habilitar2FA
  });
}

export function useConfirmar2FA() {
  const queryClient = useQueryClient();

  return useMutation<
    Confirmar2FAResponse,
    AxiosError<ApiErrorResponse>,
    Confirmar2FARequest
  >({
    mutationFn: confirmar2FA,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userAdmin"] });
    },
  });
}

export function useDesabilitar2FA() {
  const queryClient = useQueryClient();

  return useMutation<
    Desabilitar2FAResponse,
    AxiosError<ApiErrorResponse>,
    Desabilitar2FARequest
  >({
    mutationFn: desabilitar2FA,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userAdmin"] });
    },
  });
}
