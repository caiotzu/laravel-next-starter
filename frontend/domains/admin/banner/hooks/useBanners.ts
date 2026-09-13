"use client";

import { useQuery } from "@tanstack/react-query";

import { listarBanners } from "../services/bannerService";
import { BannerFiltros } from "../types/banner.filters";

export function useBanners(params?: BannerFiltros) {
  const safeParams = params ?? {};

  return useQuery({
    queryKey: ["banners", safeParams],
    queryFn: ({ queryKey }) => {
      const [, queryParams] = queryKey as [string, BannerFiltros];
      return listarBanners({
        ...queryParams,
        status: queryParams.status || undefined,
      });
    },
    placeholderData: (previousData) => previousData,
  });
}
