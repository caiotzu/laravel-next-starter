import qs from "qs";

import { proxyPrivateRequest } from "@/lib/proxy-private";

import { toRelease } from "../mappers/release.mapper";
import { ListarReleasesRequest } from "../types/release.requests";
import { ListarReleasesResponse, ReleaseDataResponse } from "../types/release.responses";

export async function listarReleases(params?: ListarReleasesRequest) {
  const query = qs.stringify(params ?? {}, { skipNulls: true });

  const response = await proxyPrivateRequest<ListarReleasesResponse>({
    url: `/releases?${query}`,
    method: "GET",
  });

  return {
    ...response.data,
    data: response.data.data.map(toRelease),
  };
}

export async function visualizarRelease(id: string) {
  const response = await proxyPrivateRequest<{ data: ReleaseDataResponse }>({
    url: `/releases/${id}`,
    method: "GET",
  });

  return toRelease(response.data.data);
}
