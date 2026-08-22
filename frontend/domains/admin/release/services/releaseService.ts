import qs from "qs";

import { proxyAdminRequest } from "@/lib/proxy-admin";

import { toRelease } from "../mappers/release.mapper";
import {
  AtualizarReleaseRequest,
  CadastrarReleaseRequest,
  ListarReleasesRequest,
} from "../types/release.requests";
import { ListarReleasesResponse, ReleaseDataResponse } from "../types/release.responses";

export async function listarReleases(params?: ListarReleasesRequest) {
  const query = qs.stringify(params ?? {}, { skipNulls: true });

  const response = await proxyAdminRequest<ListarReleasesResponse>({
    url: `/admin/releases?${query}`,
    method: "GET",
  });

  return {
    ...response.data,
    data: response.data.data.map(toRelease),
  };
}

export async function visualizarRelease(id: string) {
  const response = await proxyAdminRequest<{ data: ReleaseDataResponse }>({
    url: `/admin/releases/${id}`,
    method: "GET",
  });

  return toRelease(response.data.data);
}

export async function cadastrarRelease(payload: CadastrarReleaseRequest) {
  const response = await proxyAdminRequest<{ data: ReleaseDataResponse }>({
    url: "/admin/releases",
    method: "POST",
    data: payload,
  });

  return toRelease(response.data.data);
}

export async function atualizarRelease(id: string, payload: AtualizarReleaseRequest) {
  const response = await proxyAdminRequest<{ data: ReleaseDataResponse }>({
    url: `/admin/releases/${id}`,
    method: "PUT",
    data: payload,
  });

  return toRelease(response.data.data);
}

export async function publicarRelease(id: string) {
  const response = await proxyAdminRequest<{ data: ReleaseDataResponse }>({
    url: `/admin/releases/${id}/publicar`,
    method: "PATCH",
  });

  return toRelease(response.data.data);
}
