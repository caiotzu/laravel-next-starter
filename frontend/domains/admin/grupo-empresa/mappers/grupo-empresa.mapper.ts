 import { toGrupo } from "../../grupo/mappers/grupo.mapper";
import { GrupoEmpresa } from "../types/grupoEmpresa.model";
import { GrupoEmpresaDataResponse } from "../types/grupoEmpresa.responses";

export function toGrupoEmpresa(
  data: GrupoEmpresaDataResponse
): GrupoEmpresa {
  return {
    id: data.id,
    nome: data.nome,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    deletedAt: data.deleted_at,

    grupos: data.grupos?.map(toGrupo) ?? []
  };
}