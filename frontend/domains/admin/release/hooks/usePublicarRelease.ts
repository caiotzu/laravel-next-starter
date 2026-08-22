"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { ApiErrorResponse } from "@/types/errors";

import { publicarRelease } from "../services/releaseService";

export function usePublicarRelease() {
  const queryClient = useQueryClient();

  return useMutation<
    Awaited<ReturnType<typeof publicarRelease>>,
    AxiosError<ApiErrorResponse>,
    string
  >({
    mutationFn: (id) => publicarRelease(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["releases-admin"] });
      queryClient.invalidateQueries({ queryKey: ["release-admin", id] });
    },
  });
}
