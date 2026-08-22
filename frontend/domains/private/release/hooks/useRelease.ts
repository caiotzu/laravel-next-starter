"use client";

import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { ApiErrorResponse } from "@/types/errors";

import { visualizarRelease } from "../services/releaseService";

export function useRelease(id: string) {
  return useQuery<
    Awaited<ReturnType<typeof visualizarRelease>>,
    AxiosError<ApiErrorResponse>
  >({
    queryKey: ["release-private", id],
    queryFn: () => visualizarRelease(id),
    enabled: !!id,
  });
}
