import { proxyAdminRequest } from "@/lib/proxy-admin";

import { toUsuarioGrupoEmpresa } from "../mappers/usuario.mapper";
import { StatusUsuarioGrupoEmpresaRequest } from "../types/usuarioGrupoEmpresa.requests";
import { AlterarStatusUsuarioGrupoEmpresaResponse, RedefinirSenhaUsuarioGrupoEmpresaResponse } from "../types/usuarioGrupoEmpresa.response";

export async function redefinirSenhaUsuarioGrupoEmpresa(
  usuarioId: string,
  grupoId: string
) {
  const response =
    await proxyAdminRequest<RedefinirSenhaUsuarioGrupoEmpresaResponse>({
      url: `/admin/grupos-empresas/${grupoId}/usuarios/${usuarioId}/redefinir-senha`,
      method: "PATCH",
    });

  return response.data.data;
}

export async function alterarStatusUsuarioGrupoEmpresa(
  usuarioId: string,
  grupoId: string,
  dto: StatusUsuarioGrupoEmpresaRequest
) {
  const response =
    await proxyAdminRequest<AlterarStatusUsuarioGrupoEmpresaResponse>({
      url: `/admin/grupos-empresas/${grupoId}/usuarios/${usuarioId}/status`,
      method: "PATCH",
      data: dto,
    });

  return toUsuarioGrupoEmpresa(response.data.data);
}
