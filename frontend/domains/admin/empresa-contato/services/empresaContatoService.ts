import { proxyAdminRequest } from "@/lib/proxy-admin";

import { EmpresaContatoRequest } from "../types/empresaContato.requests";
import { EmpresaContatoResponse } from "../types/empresaContato.responses";

export async function cadastrarEmpresaContato(
  empresaId: string,
  dto: EmpresaContatoRequest
) {
  const response = await proxyAdminRequest<EmpresaContatoResponse>({
    url: `/admin/empresas/${empresaId}/contatos`,
    method: "POST",
    data: dto,
  });
  return response.data;
}

export async function atualizarEmpresaContato(
  empresaId: string,
  contatoId: string,
  dto: EmpresaContatoRequest
) {
  const response = await proxyAdminRequest<EmpresaContatoResponse>({
    url: `/admin/empresas/${empresaId}/contatos/${contatoId}`,
    method: "PUT",
    data: dto,
  });
  return response.data;
}

export function excluirEmpresaContato(
  empresaId: string,
  contatoId: string
) {
  return proxyAdminRequest<null>({
    url: `/admin/empresas/${empresaId}/contatos/${contatoId}`,
    method: "DELETE",
  });
}