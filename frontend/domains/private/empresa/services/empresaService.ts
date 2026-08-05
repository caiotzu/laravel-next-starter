import qs from "qs";

import { LaravelResourcePagination } from "@/types/laravel";

import { proxyPrivateRequest } from "@/lib/proxy-private";

import { toEmpresa } from "../mappers/empresa.mapper";
import { Empresa } from "../types/empresa.model";
import {
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


export async function editarEmpresa(
  id: string,
  dto: EditarEmpresaRequest
): Promise<Empresa> {
  const response = await proxyPrivateRequest<EditarEmpresaResponse>({
    url: `/empresas/${id}`,
    method: "PUT",
    data: dto,
  });

  return toEmpresa(response.data.data);
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
    await proxyPrivateRequest<ListarEmpresasResponse>({
      url: `/empresas?${query}`,
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
  const response = await proxyPrivateRequest<VisualizarEmpresaResponse>({
    url: `/empresas/${id}`,
    method: "GET",
  });

  return toEmpresa(response.data.data);
}
