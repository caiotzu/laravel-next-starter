import { proxyAdminRequest } from "@/lib/proxy-admin";

import { toEmpresaContato } from "../mappers/empresa-contato.mapper";
import { EmpresaContatoRequest } from "../types/empresaContato.requests";
import { CadastrarEmpresaContatoResponse, EditarEmpresaContatoResponse } from "../types/empresaContato.responses";

export async function cadastrarEmpresaContato(
  empresaId: string,
  dto: EmpresaContatoRequest
) {
  const response = await proxyAdminRequest<CadastrarEmpresaContatoResponse>({
    url: `/admin/empresas/${empresaId}/contatos`,
    method: "POST",
    data: dto,
  });
  
  return toEmpresaContato(response.data.data);
}

export async function atualizarEmpresaContato(
  empresaId: string,
  contatoId: string,
  dto: EmpresaContatoRequest
) {
  const response = await proxyAdminRequest<EditarEmpresaContatoResponse>({
    url: `/admin/empresas/${empresaId}/contatos/${contatoId}`,
    method: "PUT",
    data: dto,
  });
  
  return toEmpresaContato(response.data.data);
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