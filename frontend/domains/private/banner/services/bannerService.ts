import { proxyPrivateRequest } from "@/lib/proxy-private";

import { toBanner } from "../mappers/banner.mapper";
import { ListarBannersDisponiveisResponse } from "../types/banner.responses";

/**
 * Único endpoint consultado ao acessar o Private: o backend já resolve
 * status + período + direcionamento, então aqui é só buscar e mapear —
 * nenhum filtro adicional é feito no cliente (ver BannerService::disponiveisPara
 * no backend).
 */
export async function listarBannersDisponiveis() {
  const response = await proxyPrivateRequest<ListarBannersDisponiveisResponse>({
    url: "/banners/disponiveis",
    method: "GET",
  });

  return response.data.data.map(toBanner);
}
