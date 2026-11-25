import axios from "axios";

import { LaravelApiResponse } from "@/types/laravel";

import { proxyPrivateRequest } from "@/lib/proxy-private";

import { toVinculoSocial } from "../mappers/vinculoSocial.mapper";
import { VinculoSocial } from "../types/loginSocial.model";
import { IniciarVinculoLoginSocialRequest } from "../types/loginSocial.requests";
import {
  DesvincularLoginSocialResponse,
  IniciarVinculoLoginSocialResponse,
  ListarLoginSocialResponse,
} from "../types/loginSocial.response";

export async function listarLoginSocial(): Promise<LaravelApiResponse<VinculoSocial[]>> {
  const response = await proxyPrivateRequest<ListarLoginSocialResponse>({
    url: "/perfil/login-social",
    method: "GET",
  });

  return {
    ...response.data,
    data: response.data.data.map(toVinculoSocial),
  };
}

export async function desvincularLoginSocial(provedor: string): Promise<DesvincularLoginSocialResponse> {
  await proxyPrivateRequest<DesvincularLoginSocialResponse>({
    url: `/perfil/login-social/${provedor}`,
    method: "DELETE",
  });
}

/**
 * Não passa pelo proxy genérico: precisa gravar o cookie do binding no navegador, então tem rota
 * própria no BFF (`app/api/auth/private/social/[provedor]/vincular`).
 */
export async function iniciarVinculoLoginSocial({
  provedor,
  senha,
}: IniciarVinculoLoginSocialRequest): Promise<IniciarVinculoLoginSocialResponse> {
  const response = await axios.post<IniciarVinculoLoginSocialResponse>(
    `/api/auth/private/social/${provedor}/vincular`,
    { senha }
  );

  return response.data;
}
