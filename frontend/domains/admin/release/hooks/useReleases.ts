"use client";

import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { ApiErrorResponse } from "@/types/errors";

import { listarReleases } from "../services/releaseService";
import { ListarReleasesRequest } from "../types/release.requests";

export function useReleases(params?: ListarReleasesRequest) {
  const safeParams = params ?? {};

  return useQuery<
    Awaited<ReturnType<typeof listarReleases>>,
    AxiosError<ApiErrorResponse>
  >({
    queryKey: ["releases-admin", safeParams],
    queryFn: ({ queryKey }) => {
      const [, queryParams] = queryKey;
      return listarReleases(queryParams as ListarReleasesRequest);
    },
    placeholderData: (previousData) => previousData,
  });
}
