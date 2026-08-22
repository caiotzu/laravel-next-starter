"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { ApiErrorResponse } from "@/types/errors";

import { cadastrarRelease } from "../services/releaseService";
import { CadastrarReleaseRequest } from "../types/release.requests";

export function useCadastrarRelease() {
  const queryClient = useQueryClient();

  return useMutation<
    Awaited<ReturnType<typeof cadastrarRelease>>,
    AxiosError<ApiErrorResponse>,
    CadastrarReleaseRequest
  >({
    mutationFn: (payload) => cadastrarRelease(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["releases-admin"] });
    },
  });
}
