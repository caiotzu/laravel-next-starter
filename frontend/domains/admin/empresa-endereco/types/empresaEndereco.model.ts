export interface EmpresaEndereco {
  id: string;
  empresaId: string;
  tipo: string;
  municipioId: string;
  municipio?: {
    id: string;
    nome: string;
    uf: string;
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
