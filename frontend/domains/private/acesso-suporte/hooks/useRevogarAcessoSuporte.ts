"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { ApiErrorResponse } from "@/types/errors";

import { revogarAcessoSuporte } from "../services/acessoSuporteService";

export function useRevogarAcessoSuporte() {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError<ApiErrorResponse>, string>({
    mutationFn: (id) => revogarAcessoSuporte(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["acessosSuporte"] });
    },
  });
}
