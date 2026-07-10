 
import { toEmpresaContato } from "../../empresa-contato/mappers/empresa-contato.mapper";
import { toEmpresaEndereco } from "../../empresa-endereco/mappers/empresa-endereco.mapper";
import { toGrupoEmpresa } from "../../grupo-empresa/mappers/grupo-empresa.mapper";
import { Empresa } from "../types/empresa.model";
import { empresaDataResponse } from "../types/empresa.responses";

export function toEmpresa(
  data: empresaDataResponse
): Empresa {
  return {
    id: data.id,
    grupoEmpresaId: data.grupo_empresa_id,
    matrizId: data.matriz_id,
    cnpj: data.cnpj,
    nomeFantasia: data.nome_fantasia,
    razaoSocial: data.razao_social,
    inscricaoEstadual: data.inscricao_estadual,
    inscricaoMunicipal: data.inscricao_municipal,
    status: data.status,
    uf: data.uf,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    deletedAt: data.deleted_at,
    grupoEmpresa: data.grupo_empresa
        ? toGrupoEmpresa(data.grupo_empresa)
        : undefined,
    matriz: data.matriz
        ? toEmpresa(data.matriz)
        : undefined,
    contatos: data?.contatos?.map(toEmpresaContato) ?? [],
    enderecos: data?.enderecos?.map(toEmpresaEndereco) ?? [],
  };
}