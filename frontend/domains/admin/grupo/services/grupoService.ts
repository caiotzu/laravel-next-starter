import qs from "qs";

import { LaravelResourcePagination } from "@/types/laravel";

import { proxyAdminRequest } from "@/lib/proxy-admin";

import { toGrupo } from "../mappers/grupo.mapper";
import { Grupo } from "../types/grupo.model";
import {
  ListarGruposRequest,
} from "../types/grupo.requests";
import { AtivarGrupoResponse, ListarGruposResponse } from "../types/grupo.responses";

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