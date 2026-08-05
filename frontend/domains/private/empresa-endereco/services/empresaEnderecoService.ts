import { proxyPrivateRequest } from "@/lib/proxy-private";

import { toEmpresaEndereco } from "../mappers/empresa-endereco.mapper";
import { EmpresaEnderecoRequest } from "../types/empresaEndereco.requests";
import { CadastrarEmpresaEnderecoResponse, EditarEmpresaEnderecoResponse } from "../types/empresaEndereco.responses";

export async function cadastrarEmpresaEndereco(
  empresaId: string,
  dto: EmpresaEnderecoRequest
) {
  const response = await proxyPrivateRequest<CadastrarEmpresaEnderecoResponse>({
    url: `/empresas/${empresaId}/enderecos`,
    method: "POST",
    data: dto,
  });

  return toEmpresaEndereco(response.data.data);
}

export async function atualizarEmpresaEndereco(
  empresaId: string,
  enderecoId: string,
  dto: EmpresaEnderecoRequest
) {
  const response = await proxyPrivateRequest<EditarEmpresaEnderecoResponse>({
    url: `/empresas/${empresaId}/enderecos/${enderecoId}`,
    method: "PUT",
    data: dto,
  });

  return toEmpresaEndereco(response.data.data);
}

export function excluirEmpresaEndereco(
  empresaId: string,
  enderecoId: string
) {
  return proxyPrivateRequest<null>({
    url: `/empresas/${empresaId}/enderecos/${enderecoId}`,
    method: "DELETE",
  });
}

