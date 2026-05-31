import qs from "qs";

import { LaravelPaginationMeta, LaravelPaginationUrls } from "@/types/laravel";

import { proxyAdminRequest } from "@/lib/proxy-admin";


import { toGrupoEmpresa } from "../mappers/grupo-empresa.mapper";
import { CadastrarGrupoEmpresaRequest, EditarGrupoEmpresaRequest, ListarGrupoEmpresasRequest } from "../types/grupoEmpresa.requests";
import { AtivarGrupoEmpresaResponse, CadastrarGrupoEmpresaResponse, EditarGrupoEmpresaResponse, ListarGrupoEmpresasResponse, VisualizarGrupoEmpresaResponse } from "../types/grupoEmpresa.responses";

export async function cadastrarGrupoEmpresa(
  dto: CadastrarGrupoEmpresaRequest
) {
  const response = 
    await proxyAdminRequest<CadastrarGrupoEmpresaResponse>({
      url: "/admin/grupos-empresas",
      method: "POST",
      data: dto,
    });

  return toGrupoEmpresa(response.data.data);  
}

export async function editarGrupoEmpresa(
  id: string,
  dto: EditarGrupoEmpresaRequest
) {
  const response = 
    await proxyAdminRequest<EditarGrupoEmpresaResponse>({
      url: `/admin/grupos-empresas/${id}`,
      method: "PUT",
      data: dto,
    });

  return toGrupoEmpresa(response.data.data);  
}

export async function excluirGrupoEmpresa(
  id: string
) {
  return proxyAdminRequest<null>({
    url: `/admin/grupos-empresas/${id}`,
    method: "DELETE"
  });
}

export async function ativarGrupoEmpresa(
  id: string
) {
  const response = 
    await proxyAdminRequest<AtivarGrupoEmpresaResponse>({
      url: `/admin/grupos-empresas/${id}/ativar`,
      method: "PATCH"
    });

  return toGrupoEmpresa(response.data.data);  
}

export async function listarGrupoEmpresas(
  dto: ListarGrupoEmpresasRequest
) {
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
  
  const response = await proxyAdminRequest<ListarGrupoEmpresasResponse>({
    url: `/admin/grupos-empresas?${query}`,
    method: "GET",
  });

  return {
    ...response.data,
    data: response.data.data.map(
      toGrupoEmpresa
    ),
  };
}

export async function visualizarGrupoEmpresa(id: string) {
  const response = await proxyAdminRequest<VisualizarGrupoEmpresaResponse>({
    url: `/admin/grupos-empresas/${id}`,
    method: "GET",
  });
  
  return toGrupoEmpresa(response.data.data);
}
