import qs from "qs";

import { LaravelPaginationMeta, LaravelPaginationUrls } from "@/types/laravel";

import { proxyAdminRequest } from "@/lib/proxy-admin";

import {
  CadastrarEmpresaRequest,
  EditarEmpresaRequest,
  EmpresaContatoRequest,
  EmpresaEnderecoRequest,
  ListarEmpresasRequest,
} from "../types/empresa.requests";
import {
  AtivarEmpresaResponse,
  CadastrarEmpresaResponse,
  EditarEmpresaResponse,
  EmpresaContatoResponse,
  EmpresaEnderecoResponse,
  ListarEmpresasResponse,
  VisualizarEmpresaResponse,
} from "../types/empresa.responses";

export function cadastrarEmpresa(
  dto: CadastrarEmpresaRequest
) {
  return proxyAdminRequest<CadastrarEmpresaResponse>({
    url: "/admin/empresas",
    method: "POST",
    data: dto,
  }).then((response) => response.data);
}

export function editarEmpresa(
  id: string,
  dto: EditarEmpresaRequest
) {
  return proxyAdminRequest<EditarEmpresaResponse>({
    url: `/admin/empresas/${id}`,
    method: "PUT",
    data: dto,
  }).then((response) => response.data);
}
export async function excluirEmpresa(
  id: string
) {
  await proxyAdminRequest<null>({
    url: `/admin/empresas/${id}`,
    method: "DELETE"
  });

  return null;
}

export function ativarEmpresa(
  id: string
) {
  return proxyAdminRequest<AtivarEmpresaResponse>({
    url: `/admin/empresas/${id}/ativar`,
    method: "PATCH"
  }).then((response) => response.data);
}

export function listarEmpresas(
  dto: ListarEmpresasRequest
) {
  const query = qs.stringify(dto, { skipNulls: true });

  return proxyAdminRequest<ListarEmpresasResponse["data"]>({
    url: `/admin/empresas?${query}`,
    method: "GET",
  }).then((response) => ({
    data: response.data,
    meta: response.meta as LaravelPaginationMeta,
    links: response.links as LaravelPaginationUrls,
  }));
}

export function visualizarEmpresa(id: string) {
  return proxyAdminRequest<VisualizarEmpresaResponse>({
    url: `/admin/empresas/${id}`,
    method: "GET",
  }).then((response) => response.data);
}

export function cadastrarEmpresaContato(
  empresaId: string,
  dto: EmpresaContatoRequest
) {
  return proxyAdminRequest<EmpresaContatoResponse>({
    url: `/admin/empresas/${empresaId}/contatos`,
    method: "POST",
    data: dto,
  }).then((response) => response.data);
}

export function atualizarEmpresaContato(
  empresaId: string,
  contatoId: string,
  dto: EmpresaContatoRequest
) {
  return proxyAdminRequest<EmpresaContatoResponse>({
    url: `/admin/empresas/${empresaId}/contatos/${contatoId}`,
    method: "PUT",
    data: dto,
  }).then((response) => response.data);
}

export function excluirEmpresaContato(
  empresaId: string,
  contatoId: string
) {
  return proxyAdminRequest<null>({
    url: `/admin/empresas/${empresaId}/contatos/${contatoId}`,
    method: "DELETE",
  }).then(() => null);
}

export function cadastrarEmpresaEndereco(
  empresaId: string,
  dto: EmpresaEnderecoRequest
) {
  return proxyAdminRequest<EmpresaEnderecoResponse>({
    url: `/admin/empresas/${empresaId}/enderecos`,
    method: "POST",
    data: dto,
  }).then((response) => response.data);
}

export function atualizarEmpresaEndereco(
  empresaId: string,
  enderecoId: string,
  dto: EmpresaEnderecoRequest
) {
  return proxyAdminRequest<EmpresaEnderecoResponse>({
    url: `/admin/empresas/${empresaId}/enderecos/${enderecoId}`,
    method: "PUT",
    data: dto,
  }).then((response) => response.data);
}

export function excluirEmpresaEndereco(
  empresaId: string,
  enderecoId: string
) {
  return proxyAdminRequest<null>({
    url: `/admin/empresas/${empresaId}/enderecos/${enderecoId}`,
    method: "DELETE",
  }).then(() => null);
}
