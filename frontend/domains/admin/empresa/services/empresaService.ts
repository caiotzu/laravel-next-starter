import qs from "qs";

import { LaravelResourcePagination } from "@/types/laravel";

import { proxyAdminRequest } from "@/lib/proxy-admin";

import { toEmpresa } from "../mappers/empresa.mapper";
import { Empresa } from "../types/empresa.model";
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
): Promise<Empresa> {
  const response = await proxyAdminRequest<CadastrarEmpresaResponse>({
    url: "/admin/empresas",
    method: "POST",
    data: dto,
  });

  return toEmpresa(response.data.data);
}

export async function editarEmpresa(
  id: string,
  dto: EditarEmpresaRequest
): Promise<Empresa> {
  const response = await proxyAdminRequest<EditarEmpresaResponse>({
    url: `/admin/empresas/${id}`,
    method: "PUT",
    data: dto,
  });

  return toEmpresa(response.data.data);
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
): Promise<Empresa> {
  return proxyAdminRequest<AtivarEmpresaResponse>({
    url: `/admin/empresas/${id}/ativar`,
    method: "PATCH"
  }).then((response) => toEmpresa(response.data.data));
}

export async function listarEmpresas(
  dto: ListarEmpresasRequest
): Promise<LaravelResourcePagination<Empresa>> {
  const query = qs.stringify(dto, {
    skipNulls: true,
    filter: (_, value) => {
      if (
        value === "" ||
        value === undefined
      ) {
        return undefined;
      }

      return value;
    },
  });

  const response =
    await proxyAdminRequest<ListarEmpresasResponse>({
      url: `/admin/empresas?${query}`,
      method: "GET",
    });

  return {
    ...response.data,
    data: response.data.data.map(
      toEmpresa
    ),
  };
}

export async function visualizarEmpresa(id: string) {
  const response = await proxyAdminRequest<VisualizarEmpresaResponse>({
    url: `/admin/empresas/${id}`,
    method: "GET",
  });

  return toEmpresa(response.data.data);
}
