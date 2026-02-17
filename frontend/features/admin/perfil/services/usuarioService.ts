import { proxyAdminRequest } from "@/lib/proxy-admin";

import { AtualizarAvatarRequest } from "../types/usario.requests";
import { AtualizarAvatarResponse } from "../types/usuario.responses";

export function atualizarAvatar(
  payload: AtualizarAvatarRequest
): Promise<AtualizarAvatarResponse> {
  return proxyAdminRequest<AtualizarAvatarResponse>({
    url: "/admin/perfil/avatar",
    method: "PATCH",
    data: payload,
  });
}
