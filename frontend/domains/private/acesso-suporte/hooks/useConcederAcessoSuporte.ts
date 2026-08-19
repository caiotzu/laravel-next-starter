"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { ApiErrorResponse } from "@/types/errors";

import { concederAcessoSuporte } from "../services/acessoSuporteService";
import { AcessoSuporte } from "../types/acessoSuporte.model";
import { ConcederAcessoSuporteRequest } from "../types/acessoSuporte.requests";

export function useConcederAcessoSuporte() {
  const queryClient = useQueryClient();

  return useMutation<
    AcessoSuporte,
    AxiosError<ApiErrorResponse>,
    ConcederAcessoSuporteRequest
  >({
    mutationFn: (dados) => concederAcessoSuporte(dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["acessosSuporte"] });
    },
  });
}
