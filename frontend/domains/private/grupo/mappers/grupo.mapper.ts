 
import { toPermissao } from "../../permissao/mappers/permissao.mapper";
import { toUsuario } from "../../usuario/mappers/usuario.mapper";
import { Grupo } from "../types/grupo.model";
import { grupoDataResponse } from "../types/grupo.responses";

export function toGrupo(
  data: grupoDataResponse
): Grupo {
  return {
    id: data.id,
    versao: data.versao ?? 0,
    descricao: data.descricao, 
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    deletedAt: data.deleted_at,

    usuarios: data?.usuarios?.map(toUsuario) ?? [],
    permissoes: data?.permissoes?.map(toPermissao) ?? []
  };
}