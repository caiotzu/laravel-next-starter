import qs from "qs";

import { proxyAdminRequest } from "@/lib/proxy-admin";

import { toBanner } from "../mappers/banner.mapper";
import {
  AtualizarBannerRequest,
  CadastrarBannerRequest,
  ListarBannersRequest,
} from "../types/banner.requests";
import {
  AtualizarBannerResponse,
  CadastrarBannerResponse,
  ListarBannersResponse,
  VisualizarBannerResponse,
} from "../types/banner.responses";

export async function cadastrarBanner(dto: CadastrarBannerRequest) {
  const response = await proxyAdminRequest<CadastrarBannerResponse>({
    url: "/admin/banners",
    method: "POST",
    data: dto,
  });

  return toBanner(response.data.data);
}

export async function atualizarBanner({
  id,
  dto,
}: {
  id: string;
  dto: AtualizarBannerRequest;
}) {
  const response = await proxyAdminRequest<AtualizarBannerResponse>({
    url: `/admin/banners/${id}`,
    method: "PUT",
    data: dto,
  });

  return toBanner(response.data.data);
}

export async function listarBanners(dto: ListarBannersRequest) {
  const query = qs.stringify(dto, {
    skipNulls: true,
    filter: (_, value) => (value === "" || value === undefined ? undefined : value),
  });

  const response = await proxyAdminRequest<ListarBannersResponse>({
    url: `/admin/banners?${query}`,
    method: "GET",
  });

  return {
    ...response.data,
    data: response.data.data.map(toBanner),
  };
}

export async function visualizarBanner(id: string) {
  const response = await proxyAdminRequest<VisualizarBannerResponse>({
    url: `/admin/banners/${id}`,
    method: "GET",
  });

  return toBanner(response.data.data);
}

export async function ativarBanner(id: string) {
  const response = await proxyAdminRequest<AtualizarBannerResponse>({
    url: `/admin/banners/${id}/ativar`,
    method: "PATCH",
  });

  return toBanner(response.data.data);
}

export async function desativarBanner(id: string) {
  const response = await proxyAdminRequest<AtualizarBannerResponse>({
    url: `/admin/banners/${id}/desativar`,
    method: "PATCH",
  });

  return toBanner(response.data.data);
}

export async function excluirBanner(id: string) {
  await proxyAdminRequest<null>({
    url: `/admin/banners/${id}`,
    method: "DELETE",
  });
}
