import { proxyAdminRequest } from "@/lib/proxy-admin";

import { toAcessoSuporte } from "../mappers/acessoSuporte.mapper";
import { AcessoSuporte } from "../types/acessoSuporte.model";
import {
  EncerrarAcessoSuporteResponse,
  ListarAcessosSuporteResponse,
} from "../types/acessoSuporte.responses";

export async function listarAcessosSuporteRecebidos(): Promise<AcessoSuporte[]> {
  const response = await proxyAdminRequest<ListarAcessosSuporteResponse>({
    url: "/admin/acessos-suporte",
    method: "GET",
  });

  return response.data.data.map(toAcessoSuporte);
}

export async function encerrarAcessoSuporte(
  id: string
): Promise<EncerrarAcessoSuporteResponse> {
  const response = await proxyAdminRequest<EncerrarAcessoSuporteResponse>({
    url: `/admin/acessos-suporte/${id}`,
    method: "DELETE",
  });

  return response.data;
}
