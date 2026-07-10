import { EmpresaEndereco } from "../types/empresaEndereco.model";
import { EmpresaEnderecoDataResponse } from "../types/empresaEndereco.responses";

export function toEmpresaEndereco(
  data: EmpresaEnderecoDataResponse
): EmpresaEndereco {
  return {
    id: data.id,
    empresaId: data.empresa_id,
    tipo: data.tipo,
    municipioId: data.municipio_id,
    municipio: data.municipio ?? null,
    ativo: data.ativo,
    principal: data.principal,
    cep: data.cep,
    logradouro: data.logradouro,
    numero: data.numero,
    bairro: data.bairro,
    complemento: data.complemento,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    deletedAt: data.deleted_at ?? null
  };
}
