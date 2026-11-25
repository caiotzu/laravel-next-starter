import axios from "axios";

import { LaravelApiResponse } from "@/types/laravel";

import { proxyAdminRequest } from "@/lib/proxy-admin";

import { toVinculoSocial } from "../mappers/vinculoSocial.mapper";
import { VinculoSocial } from "../types/loginSocial.model";
import { IniciarVinculoLoginSocialRequest } from "../types/loginSocial.requests";
import {
  DesvincularLoginSocialResponse,
  IniciarVinculoLoginSocialResponse,
  ListarLoginSocialResponse,
} from "../types/loginSocial.response";

export async function listarLoginSocial(): Promise<LaravelApiResponse<VinculoSocial[]>> {
  const response = await proxyAdminRequest<ListarLoginSocialResponse>({
    url: "/admin/perfil/login-social",
    method: "GET",
  });

  return {
    ...response.data,
    data: response.data.data.map(toVinculoSocial),
  };
}

export async function desvincularLoginSocial(provedor: string): Promise<DesvincularLoginSocialResponse> {
  await proxyAdminRequest<DesvincularLoginSocialResponse>({
    url: `/admin/perfil/login-social/${provedor}`,
    method: "DELETE",
  });
}

/**
 * Não passa pelo proxy genérico: precisa gravar o cookie do binding no navegador, então tem rota
 * própria no BFF (`app/api/auth/admin/social/[provedor]/vincular`).
 */
export async function iniciarVinculoLoginSocial({
  provedor,
  senha,
}: IniciarVinculoLoginSocialRequest): Promise<IniciarVinculoLoginSocialResponse> {
  const response = await axios.post<IniciarVinculoLoginSocialResponse>(
    `/api/auth/admin/social/${provedor}/vincular`,
    { senha }
  );

  return response.data;
}
