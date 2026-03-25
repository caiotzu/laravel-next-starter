import qs from "qs";

import { proxyAdminRequest } from "@/lib/proxy-admin";

import { CadastrarEmpresaRequest, EditarEmpresaRequest, ListarEmpresasRequest } from "../types/empresa.requests";
import { AtivarEmpresaResponse, CadastrarEmpresaResponse, EditarEmpresaResponse, ListarEmpresasResponse, VisualizarEmpresaResponse } from "../types/empresa.responses";

export function cadastrarEmpresa(
  dto: CadastrarEmpresaRequest
) {
  return proxyAdminRequest<CadastrarEmpresaResponse>({
    url: "/admin/empresas",
    method: "POST",
    data: dto,
  });
}

export function editarEmpresa(
  id: string,
  dto: EditarEmpresaRequest
) {
  return proxyAdminRequest<EditarEmpresaResponse>({
    url: `/admin/empresas/${id}`,
    method: "PUT",
    data: dto,
  });
}
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

export function visualizarEmpresa(id: string) {
  return proxyAdminRequest<VisualizarEmpresaResponse>({
    url: `/admin/empresas/${id}`,
    method: "GET",
  });
}
