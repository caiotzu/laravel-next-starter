import qs from "qs";

import { proxyAdminRequest } from "@/lib/proxy-admin";

import { 
	CadastrarUsuarioRequest,
	EditarUsuarioRequest,
	ListarUsuarioRequest 
} from "../types/usuario.requests";
import { 
	AtivarUsuarioResponse,
	CadastrarUsuarioResponse,
	EditarUsuarioResponse,
	ListarUsuariosResponse,
	VisualizarUsuarioResponse 
} from "../types/usuario.responses";

export async function cadastrarUsuario(
  dto: CadastrarUsuarioRequest
) {
  const response = await proxyAdminRequest<CadastrarUsuarioResponse>({
    url: "/admin/usuarios",
    method: "POST",
    data: dto,
  });
  return response.data;
}

export async function editarUsuario(
  id: string,
  dto: EditarUsuarioRequest
) {
  const response = await proxyAdminRequest<EditarUsuarioResponse>({
    url: `/admin/usuarios/${id}`,
    method: "PUT",
    data: dto,
  });
  return response.data;
}

export async function excluirUsuario(
  id: string
) {
  return proxyAdminRequest<null>({
    url: `/admin/usuarios/${id}`,
    method: "DELETE"
  });
}

export async function ativarUsuario(
  id: string
) {
  const response = await proxyAdminRequest<AtivarUsuarioResponse>({
    url: `/admin/usuarios/${id}/ativar`,
    method: "PATCH"
  });
  return response.data;
}

export function listarUsuarios(
  dto: ListarUsuarioRequest
) {

  const query = qs.stringify(dto, {
		skipNulls: true,
		filter: (_, value) => {
			if (value === "" || value === undefined) {
				return undefined;
			}

			return value;
		},
	});

  return proxyAdminRequest<ListarUsuariosResponse>({
    url: `/admin/usuarios?${query}`,
    method: "GET",
  });
}

export async function visualizarUsuario(
	id: string
) {
  const response = await proxyAdminRequest<VisualizarUsuarioResponse>({
    url: `/admin/usuarios/${id}`,
    method: "GET",
  });
  return response.data;
}
