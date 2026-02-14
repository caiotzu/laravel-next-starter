import qs from "qs";

import { proxyAdminRequest } from "@/lib/proxy-admin";

import { GrupoEmpresa } from "../types/grupoEmpresa.model";
import { CadastrarGrupoEmpresaRequest, EditarGrupoEmpresaRequest, ListarGrupoEmpresasRequest } from "../types/grupoEmpresa.requests";
import { CadastrarGrupoEmpresaResponse, EditarGrupoEmpresaResponse, ListarGrupoEmpresasResponse, VisualizarGrupoEmpresaResponse } from "../types/grupoEmpresa.responses";

export function cadastrarGrupoEmpresa(
  dto: CadastrarGrupoEmpresaRequest
) {
  return proxyAdminRequest<CadastrarGrupoEmpresaResponse>({
    url: "/admin/grupos-empresas",
    method: "POST",
    data: dto,
  });
}

export function editarGrupoEmpresa(
  id: string,
  dto: EditarGrupoEmpresaRequest
) {
  return proxyAdminRequest<EditarGrupoEmpresaResponse>({
    url: `/admin/grupos-empresas/${id}`,
    method: "PATCH",
    data: dto,
  });
}

export async function excluirGrupoEmpresa(
  id: string
) {
  return proxyAdminRequest<EditarGrupoEmpresaResponse>({
    url: `/admin/grupos-empresas/${id}`,
    method: "DELETE"
  });
}

export function ativarGrupoEmpresa(
  id: string
) {
  return proxyAdminRequest<EditarGrupoEmpresaResponse>({
    url: `/admin/grupos-empresas/${id}/ativar`,
    method: "PATCH"
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
  return proxyAdminRequest<VisualizarGrupoEmpresaResponse>({
    url: `/admin/grupos-empresas/${id}`,
    method: "GET",
  });
}