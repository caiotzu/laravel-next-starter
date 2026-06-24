import qs from "qs";

import { LaravelResourcePagination } from "@/types/laravel";

import { proxyAdminRequest } from "@/lib/proxy-admin";

import { toGrupo } from "../mappers/grupo.mapper";
import { Grupo } from "../types/grupo.model";
import {
  CadastrarGrupoRequest,
  EditarGrupoRequest,
  ListarGruposRequest,
  SincronizarPermissoesGrupoRequest,
} from "../types/grupo.requests";
import { AtivarGrupoResponse, CadastrarGrupoResponse, EditarGrupoResponse, ListarGruposResponse, VisualizarGrupoResponse } from "../types/grupo.responses";

export async function cadastrarGrupo(
  dto: CadastrarGrupoRequest
) {
  const response = 
    await proxyAdminRequest<CadastrarGrupoResponse>({
      url: "/admin/grupos",
      method: "POST",
      data: dto,
    });

  return toGrupo(response.data.data);  
}

export async function editarGrupo(
  id: string,
  dto: EditarGrupoRequest
) {
  const response = 
    await proxyAdminRequest<EditarGrupoResponse>({
      url: `/admin/grupos/${id}`,
      method: "PUT",
      data: dto,
    });

  return toGrupo(response.data.data);  
}

export async function excluirGrupo(
  id: string
) {
  return proxyAdminRequest<null>({
    url: `/admin/grupos/${id}`,
    method: "DELETE"
  });
}

export async function ativarGrupo(
  id: string
) {
  const response = 
    await proxyAdminRequest<AtivarGrupoResponse>({
      url: `/admin/grupos/${id}/ativar`,
      method: "PATCH"
    });

  return toGrupo(response.data.data);  
}

export async function listarGrupos(
  dto: ListarGruposRequest
): Promise<LaravelResourcePagination<Grupo>> {
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
    await proxyAdminRequest<ListarGruposResponse>({
      url: `/admin/grupos?${query}`,
      method: "GET",
    });

  return {
    ...response.data,
    data: response.data.data.map(
      toGrupo
    ),
  };
}

export async function visualizarGrupo(id: string) {
  const response = await proxyAdminRequest<VisualizarGrupoResponse>({
    url: `/admin/grupos/${id}`,
    method: "GET",
  });
  
  return toGrupo(response.data.data);
}

export async function sincronizarPermissoesGrupo(
  id: string,
  dto: SincronizarPermissoesGrupoRequest
) {
  const response = 
    await proxyAdminRequest<EditarGrupoResponse>({
      url: `/admin/grupos/${id}/permissoes`,
      method: "PATCH",
      data: dto,
    });

  return toGrupo(response.data.data);  
}