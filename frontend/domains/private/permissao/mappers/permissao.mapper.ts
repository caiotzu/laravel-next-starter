import { Permissao } from "../types/permissao.model";
import { PermissaoDataResponse } from "../types/permissao.responses";

export function toPermissao(
  data: PermissaoDataResponse
): Permissao {
  return {
    id: data.id,
    chave: data.chave,
    descricao: data.descricao,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    deletedAt: data.deleted_at,
  };
}