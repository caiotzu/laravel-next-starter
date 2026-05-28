export interface EmpresaEnderecoResponse {
  id: string;
  empresa_id: string;
  tipo: string;
  tipo_descricao: string;
  municipio_id: string;
  ativo: boolean;
  principal: boolean;
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  complemento: string | null;
  created_at: string;
  updated_at: string | null;
  deleted_at?: string | null;
  municipio?: {
    id: string;
    nome: string;
    uf: string;
  };
}