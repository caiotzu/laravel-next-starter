import { proxyAdminRequest } from "@/lib/proxy-admin";

import { toEmpresaEndereco } from "../mappers/empresa-endereco.mapper";
import { EmpresaEnderecoRequest } from "../types/empresaEndereco.requests";
import { CadastrarEmpresaEnderecoResponse, EditarEmpresaEnderecoResponse, empresaEnderecoDataResponse } from "../types/empresaEndereco.responses";

export async function cadastrarEmpresaEndereco(
  empresaId: string,
  dto: EmpresaEnderecoRequest
) {
  const response = await proxyAdminRequest<CadastrarEmpresaEnderecoResponse>({
    url: `/admin/empresas/${empresaId}/enderecos`,
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
  const response = await proxyAdminRequest<EditarEmpresaEnderecoResponse>({
    url: `/admin/empresas/${empresaId}/enderecos/${enderecoId}`,
    method: "PUT",
    data: dto,
  });

  return toEmpresaEndereco(response.data.data);
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

