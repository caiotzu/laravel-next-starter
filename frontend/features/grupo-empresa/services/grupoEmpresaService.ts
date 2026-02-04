// import { proxyRequest } from "@/lib/proxy";

import qs from "qs";
import {
  CadastrarGrupoEmpresaRequest,
  CadastrarGrupoEmpresaResponse,
  ListarGrupoEmpresasRequest,
  ListarGrupoEmpresasResponse,
  GrupoEmpresa
} from "../types";
import { proxyAdminRequest } from "@/lib/proxy-admin";


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