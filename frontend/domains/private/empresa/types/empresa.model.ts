import { EmpresaStatus } from "@/constants/empresa-status";

import { EmpresaContato } from "../../empresa-contato/types/empresaContato.model";
import { EmpresaEndereco } from "../../empresa-endereco/types/empresaEndereco.model";
import { GrupoEmpresa } from "../../grupo-empresa/types/grupoEmpresa.model";

export interface Empresa {
  id: string;
  grupoEmpresaId: string;
  matrizId: string | null;
  cnpj: string;
  nomeFantasia: string;
  razaoSocial: string;
  inscricaoEstadual: string | null;
  inscricaoMunicipal: string | null;
  status: EmpresaStatus;
  uf: string;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;

  grupoEmpresa?: GrupoEmpresa,
  matriz?: Empresa | null,

  contatos?: EmpresaContato[],
  enderecos?: EmpresaEndereco[]
}
