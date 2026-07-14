import { EmpresaEnderecoTipo } from "@/constants/empresa-endereco-tipos";

export interface EmpresaEndereco {
  id: string;
  empresaId: string;
  tipo: EmpresaEnderecoTipo;
  municipioId: string;
  municipio?: {
    id: string;
    nome: string;
    uf: string;
    codigo_ibge: string;
    codigo_siafi: string;
  } | null;
  ativo: boolean;
  principal: boolean;
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  complemento: string | null;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
}
