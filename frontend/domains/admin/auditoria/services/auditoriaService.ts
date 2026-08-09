import qs from "qs";

import { LaravelResourcePagination } from "@/types/laravel";

import { proxyAdminRequest } from "@/lib/proxy-admin";

import { toAuditoria } from "../mappers/auditoria.mapper";
import { Auditoria } from "../types/auditoria.model";
import { ListarAuditoriasRequest } from "../types/auditoria.requests";
import { ListarAuditoriasResponse } from "../types/auditoria.responses";

export async function listarAuditorias(
  dto: ListarAuditoriasRequest
): Promise<LaravelResourcePagination<Auditoria>> {
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
    await proxyAdminRequest<ListarAuditoriasResponse>({
      url: `/admin/auditorias?${query}`,
      method: "GET",
    });

  return {
    ...response.data,
    data: response.data.data.map(
      toAuditoria
    ),
  };
}
