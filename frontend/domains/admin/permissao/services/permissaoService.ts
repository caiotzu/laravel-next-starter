import { LaravelApiResponse } from "@/types/laravel";

import { proxyAdminRequest } from "@/lib/proxy-admin";

import { toPermissao } from "../mappers/permissao.mapper";
import { Permissao } from "../types/permissao.model";
import { ListarPermissoesResponse } from "../types/permissao.responses";

export async function listarPermissoes(): Promise<LaravelApiResponse<Permissao[]>> {
	const response =
		await proxyAdminRequest<ListarPermissoesResponse>({
			url: `/admin/permissoes`,
			method: "GET",
		});

  return {
    ...response.data,
    data: response.data.data.map(
      toPermissao
    ),
  };
}

