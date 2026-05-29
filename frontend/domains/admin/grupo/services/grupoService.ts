import qs from "qs";

import { LaravelResourcePagination } from "@/types/laravel";

import { proxyAdminRequest } from "@/lib/proxy-admin";

import { toGrupo } from "../mappers/grupo.mapper";
import { Grupo } from "../types/grupo.model";
import {
  ListarGruposRequest,
} from "../types/grupo.requests";
import { ListarGruposResponse } from "../types/grupo.responses";


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