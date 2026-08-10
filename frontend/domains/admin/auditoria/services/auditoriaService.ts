import qs from "qs";

import { LaravelResourcePagination } from "@/types/laravel";

import { proxyAdminRequest } from "@/lib/proxy-admin";

import { toAuditoria } from "../mappers/auditoria.mapper";
import {
  AuditoriaEntidadeOption,
  AuditoriaEntidadeRegistro,
  ListarRegistrosAuditoriaEntidadeRequest,
  ListarRegistrosAuditoriaEntidadeResponse,
} from "../types/auditoria-entidade";
import { Auditoria } from "../types/auditoria.model";
import { ListarAuditoriasRequest } from "../types/auditoria.requests";
import { ListarAuditoriasResponse } from "../types/auditoria.responses";

export async function listarEntidadesAuditaveis(): Promise<AuditoriaEntidadeOption[]> {
  const response = await proxyAdminRequest<{ data: AuditoriaEntidadeOption[] }>({
    url: "/admin/auditorias/entidades",
    method: "GET",
  });

  return response.data.data;
}

export async function listarRegistrosEntidadeAuditavel(
  entidade: string,
  params: ListarRegistrosAuditoriaEntidadeRequest
): Promise<AuditoriaEntidadeRegistro[]> {
  const query = qs.stringify(params, { skipNulls: true });
  const url = entidade === "usuarios"
    ? `/admin/auditorias/usuarios?${query}`
    : `/admin/auditorias/entidades/${entidade}?${query}`;

  const response = await proxyAdminRequest<ListarRegistrosAuditoriaEntidadeResponse>({
    url,
    method: "GET",
  });

  return response.data.data;
}

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
