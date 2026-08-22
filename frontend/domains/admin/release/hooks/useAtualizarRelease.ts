"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { ApiErrorResponse } from "@/types/errors";

import { atualizarRelease } from "../services/releaseService";
import { AtualizarReleaseRequest } from "../types/release.requests";

export function useAtualizarRelease() {
  const queryClient = useQueryClient();

  return useMutation<
    Awaited<ReturnType<typeof atualizarRelease>>,
    AxiosError<ApiErrorResponse>,
    { id: string; payload: AtualizarReleaseRequest }
  >({
    mutationFn: ({ id, payload }) => atualizarRelease(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["releases-admin"] });
      queryClient.invalidateQueries({ queryKey: ["release-admin", variables.id] });
    },
  });
}
