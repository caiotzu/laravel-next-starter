 
import { toUsuario } from "../../usuario/mappers/usuario.mapper";
import { Grupo } from "../types/grupo.model";
import { grupoDataResponse } from "../types/grupo.responses";

export function toGrupo(
  data: grupoDataResponse
): Grupo {
  return {
    id: data.id,
    descricao: data.descricao, 
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    deletedAt: data.deleted_at,

    usuarios: data?.usuarios?.map(toUsuario)
  };
}