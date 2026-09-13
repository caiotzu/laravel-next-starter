"use client";

import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { ApiErrorResponse } from "@/types/errors";

import { visualizarBanner } from "../services/bannerService";
import { Banner } from "../types/banner.model";

export function useBanner(id: string) {
  return useQuery<Banner, AxiosError<ApiErrorResponse>>({
    queryKey: ["banner", id],
    queryFn: ({ queryKey }) => {
      const [, bannerId] = queryKey;
      return visualizarBanner(bannerId as string);
    },
    enabled: !!id,
  });
}
