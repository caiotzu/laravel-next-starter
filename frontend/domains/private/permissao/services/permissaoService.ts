import { LaravelApiResponse } from "@/types/laravel";

import { proxyPrivateRequest } from "@/lib/proxy-private";

import { toPermissao } from "../mappers/permissao.mapper";
import { Permissao } from "../types/permissao.model";
import { ListarPermissoesResponse } from "../types/permissao.responses";

export async function listarPermissoes(): Promise<LaravelApiResponse<Permissao[]>> {
	const response =
		await proxyPrivateRequest<ListarPermissoesResponse>({
			url: `/permissoes`,
			method: "GET",
		});

  return {
    ...response.data,
    data: response.data.data.map(
      toPermissao
    ),
  };
}

