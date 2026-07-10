import { EmpresaContato } from "../types/empresaContato.model";
import { EmpresaContatoDataResponse } from "../types/empresaContato.responses";

export function toEmpresaContato(
  data: EmpresaContatoDataResponse
): EmpresaContato {
  return {
    id: data.id,
    empresaId: data.empresa_id,
    tipo: data.tipo,
    valor: data.valor,
    ativo: data.ativo,
    principal: data.principal,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    deletedAt: data.deleted_at
  };
}