// import { proxyRequest } from "@/lib/proxy";

import qs from "qs";

import { proxyAdminRequest } from "@/lib/proxy-admin";

import { GrupoEmpresa } from "../types/grupoEmpresa.model";
import { CadastrarGrupoEmpresaRequest, ListarGrupoEmpresasRequest } from "../types/grupoEmpresa.requests";
import { CadastrarGrupoEmpresaResponse, ListarGrupoEmpresasResponse } from "../types/grupoEmpresa.responses";

export function cadastrarGrupoEmpresa(
  dto: CadastrarGrupoEmpresaRequest
) {
  return proxyAdminRequest<CadastrarGrupoEmpresaResponse>({
    url: "/admin/grupos-empresas",
    method: "POST",
    data: dto,
  });
}

export function listarGrupoEmpresas(
  dto: ListarGrupoEmpresasRequest
) {
  const query = qs.stringify(dto, { skipNulls: true });

  return proxyAdminRequest<ListarGrupoEmpresasResponse>({
    url: `/admin/grupos-empresas?${query}`,
    method: "GET",
  });
}

export function visualizarGrupoEmpresa(id: string) {
  return proxyAdminRequest<GrupoEmpresa>({
    url: `/admin/grupos-empresas/${id}`,
    method: "GET",
  });
}