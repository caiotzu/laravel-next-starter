 
import { toGrupo } from "../../grupo/mappers/grupo.mapper";
import { Usuario } from "../types/usuario.model";
import { UsuarioResponse } from "../types/usuario.responses";


export function toUsuario(
  data: UsuarioResponse
): Usuario {
  return {
    id: data.id,
    grupoId: data.grupo_id,
    nome: data.nome,
    email: data.email,
    status: data.status,
    avatar: data.avatar,
    google2faEnable: data.google2fa_enable,
    google2faConfirmadoEm: data.google2fa_confirmado_em,
    ultimoLoginEm: data.ultimo_login_em,
    ultimoIp: data.ultimo_ip,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    deletedAt: data.deleted_at,

    grupo: data.grupo
      ? toGrupo(data.grupo)
      : undefined,
  };
}