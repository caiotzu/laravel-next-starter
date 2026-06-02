 
import { UsuarioSessoes } from "../types/usuarioSessoes.model";
import { UsuarioSessaoDataResponse } from "../types/usuarioSessoes.response";

export function toUsuarioSessao(
  data: UsuarioSessaoDataResponse
): UsuarioSessoes {
  return {
    id: data.id,
    usuarioId: data.usuario_id,
    ip: data.ip,
    browser: data.browser,
    plataforma: data.plataforma,
    dispositivo: data.dispositivo,
    ativo: data.ativo,
    ultimoAcessoEm: data.ultimo_acesso_em,
    atual:data.atual,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    deletedAt: data.deleted_at,
  };
}