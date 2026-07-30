import qs from "qs";

import { LaravelResourcePagination } from "@/types/laravel";

import { proxyPrivateRequest } from "@/lib/proxy-private";

import { toUsuario } from "../mappers/usuario.mapper";
import { Usuario } from "../types/usuario.model";
import {
  CadastrarUsuarioRequest,
  EditarUsuarioRequest,
  ListarUsuariosRequest,
} from "../types/usuario.requests";
import {
  AtivarUsuarioResponse,
  CadastrarUsuarioResponse,
  EditarUsuarioResponse,
  ListarUsuariosResponse,
  VisualizarUsuarioResponse,
} from "../types/usuario.responses";

export async function cadastrarUsuario(
  dto: CadastrarUsuarioRequest
) {
  const response =
    await proxyPrivateRequest<CadastrarUsuarioResponse>({
      url: "/usuarios",
      method: "POST",
      data: dto,
    });

  return toUsuario(response.data.data);
}

export async function editarUsuario(
  id: string,
  dto: EditarUsuarioRequest
) {
  const response =
    await proxyPrivateRequest<EditarUsuarioResponse>({
      url: `/usuarios/${id}`,
      method: "PUT",
      data: dto,
    });

  return toUsuario(response.data.data);
}

export async function excluirUsuario(
  id: string
) {
  return proxyPrivateRequest<null>({
    url: `/usuarios/${id}`,
    method: "DELETE",
  });
}

export async function ativarUsuario(
  id: string
) {
  const response =
    await proxyPrivateRequest<AtivarUsuarioResponse>({
      url: `/usuarios/${id}/ativar`,
      method: "PATCH",
    });

  return toUsuario(response.data.data);
}

export async function listarUsuarios(
  dto: ListarUsuariosRequest
): Promise<LaravelResourcePagination<Usuario>> {
  const query = qs.stringify(dto, {
    skipNulls: true,
    filter: (_, value) => {
      if (
        value === "" ||
        value === undefined
      ) {
        return undefined;
      }

      return value;
    },
  });

  const response =
    await proxyPrivateRequest<ListarUsuariosResponse>({
      url: `/usuarios?${query}`,
      method: "GET",
    });

  return {
    ...response.data,
    data: response.data.data.map(
      toUsuario
    ),
  };
}

export async function visualizarUsuario(
  id: string
) {
  const response =
    await proxyPrivateRequest<VisualizarUsuarioResponse>({
      url: `/usuarios/${id}`,
      method: "GET",
    });

  return toUsuario(response.data.data);
}