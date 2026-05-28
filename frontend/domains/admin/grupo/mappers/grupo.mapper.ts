 
import { Grupo } from "../types/grupo.model";
import { GrupoResponse } from "../types/grupo.responses";

export function toGrupo(
  data: GrupoResponse
): Grupo {
  return {
    id: data.id,
    descricao: data.descricao, 
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    deletedAt: data.deleted_at,
  };
}