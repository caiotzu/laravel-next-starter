 import { GrupoEmpresa } from "../types/grupoEmpresa.model";
import { GrupoEmpresaResponse } from "../types/grupoEmpresa.responses";

export function toGrupoEmpresa(
  data: GrupoEmpresaResponse
): GrupoEmpresa {
  return {
    id: data.id,
    nome: data.nome,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    deletedAt: data.deleted_at,
  };
}