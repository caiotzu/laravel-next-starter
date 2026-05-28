import qs from "qs";

import { LaravelPaginationMeta, LaravelPaginationUrls } from "@/types/laravel";

import { proxyAdminRequest } from "@/lib/proxy-admin";
import { removeEmptyValues } from "@/lib/utils";

import {
  CadastrarEmpresaRequest,
  EditarEmpresaRequest,
  ListarEmpresasRequest,
} from "../types/empresa.requests";
import {
  AtivarEmpresaResponse,
  CadastrarEmpresaResponse,
  EditarEmpresaResponse,
  ListarEmpresasResponse,
  VisualizarEmpresaResponse,
} from "../types/empresa.responses";

export async function cadastrarEmpresa(
  dto: CadastrarEmpresaRequest
) {
  const response = await proxyAdminRequest<CadastrarEmpresaResponse>({
    url: "/admin/empresas",
    method: "POST",
    data: dto,
  });
  return response.data;
}

export async function editarEmpresa(
  id: string,
  dto: EditarEmpresaRequest
) {
  const response = await proxyAdminRequest<EditarEmpresaResponse>({
    url: `/admin/empresas/${id}`,
    method: "PUT",
    data: dto,
  });
  return response.data;
}

export function excluirEmpresa(
  id: string
) {
  return proxyAdminRequest<null>({
    url: `/admin/empresas/${id}`,
    method: "DELETE"
  });
}

export function ativarEmpresa(
  id: string
) {
  return proxyAdminRequest<AtivarEmpresaResponse>({
    url: `/admin/empresas/${id}/ativar`,
    method: "PATCH"
  });
}

export function listarEmpresas(
  dto: ListarEmpresasRequest
) {

  const query = qs.stringify(dto, {
    skipNulls: true,
    filter: (_, value) => {
      if (value === "" || value === undefined) {
        return undefined;
      }

      return value;
    },
  });

  return proxyAdminRequest<ListarEmpresasResponse>({
    url: `/admin/empresas?${query}`,
    method: "GET",
  });
}

export async function visualizarEmpresa(id: string) {
  const response = await proxyAdminRequest<VisualizarEmpresaResponse>({
    url: `/admin/empresas/${id}`,
    method: "GET",
  });
  return response.data;
}