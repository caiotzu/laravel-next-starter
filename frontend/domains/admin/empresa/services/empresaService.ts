import qs from "qs";

import { proxyAdminRequest } from "@/lib/proxy-admin";

import { ListarEmpresasRequest } from "../types/empresa.requests";
import { AtivarEmpresaResponse, ListarEmpresasResponse } from "../types/empresa.responses";

/*
export function cadastrarEmpresa(
  dto: CadastrarGrupoEmpresaRequest
) {
  return proxyAdminRequest<CadastrarGrupoEmpresaResponse>({
    url: "/admin/grupos-empresas",
    method: "POST",
    data: dto,
  });
}

export function editarEmpresa(
  id: string,
  dto: EditarGrupoEmpresaRequest
) {
  return proxyAdminRequest<EditarGrupoEmpresaResponse>({
    url: `/admin/grupos-empresas/${id}`,
    method: "PATCH",
    data: dto,
  });
}
*/
export async function excluirEmpresa(
  id: string
) {
  return proxyAdminRequest<null>({
    url: `/admin/empresas/${id}`,
    method: "DELETE"
  });
}

export function ativarEmpresa(
  id: string
) {
  return proxyAdminRequest<AtivarEmpresaResponse>({
    url: `/admin/empresas/${id}/ativar`,
    method: "PATCH"
  });
}

export function listarEmpresas(
  dto: ListarEmpresasRequest
) {
  const query = qs.stringify(dto, { skipNulls: true });

  return proxyAdminRequest<ListarEmpresasResponse>({
    url: `/admin/empresas?${query}`,
    method: "GET",
  });
}

/*
export function visualizarEmpresa(id: string) {
  return proxyAdminRequest<VisualizarGrupoEmpresaResponse>({
    url: `/admin/grupos-empresas/${id}`,
    method: "GET",
  });
}
  */
