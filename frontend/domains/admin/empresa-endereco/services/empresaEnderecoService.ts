import { proxyAdminRequest } from "@/lib/proxy-admin";

import { EmpresaEnderecoRequest } from "../types/empresaEndereco.requests";
import { EmpresaEnderecoResponse } from "../types/empresaEndereco.responses";

export async function cadastrarEmpresaEndereco(
  empresaId: string,
  dto: EmpresaEnderecoRequest
) {
  const response = await proxyAdminRequest<EmpresaEnderecoResponse>({
    url: `/admin/empresas/${empresaId}/enderecos`,
    method: "POST",
    data: dto,
  });

  return response.data;
}

export async function atualizarEmpresaEndereco(
  empresaId: string,
  enderecoId: string,
  dto: EmpresaEnderecoRequest
) {
  const response = await proxyAdminRequest<EmpresaEnderecoResponse>({
    url: `/admin/empresas/${empresaId}/enderecos/${enderecoId}`,
    method: "PUT",
    data: dto,
  });

  return response.data;
}

export function excluirEmpresaEndereco(
  empresaId: string,
  enderecoId: string
) {
  return proxyAdminRequest<null>({
    url: `/admin/empresas/${empresaId}/enderecos/${enderecoId}`,
    method: "DELETE",
  });
}

