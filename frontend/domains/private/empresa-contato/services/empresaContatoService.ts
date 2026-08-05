import { proxyPrivateRequest } from "@/lib/proxy-private";

import { toEmpresaContato } from "../mappers/empresa-contato.mapper";
import { EmpresaContatoRequest } from "../types/empresaContato.requests";
import { CadastrarEmpresaContatoResponse, EditarEmpresaContatoResponse } from "../types/empresaContato.responses";

export async function cadastrarEmpresaContato(
  empresaId: string,
  dto: EmpresaContatoRequest
) {
  const response = await proxyPrivateRequest<CadastrarEmpresaContatoResponse>({
    url: `/empresas/${empresaId}/contatos`,
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
  const response = await proxyPrivateRequest<EditarEmpresaContatoResponse>({
    url: `/empresas/${empresaId}/contatos/${contatoId}`,
    method: "PUT",
    data: dto,
  });
  
  return toEmpresaContato(response.data.data);
}

export function excluirEmpresaContato(
  empresaId: string,
  contatoId: string
) {
  return proxyPrivateRequest<null>({
    url: `/empresas/${empresaId}/contatos/${contatoId}`,
    method: "DELETE",
  });
}