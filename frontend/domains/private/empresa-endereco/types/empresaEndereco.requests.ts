export interface EmpresaEnderecoRequest {
  tipo: string;
  municipio_id: string;
  principal: boolean;
  ativo: boolean;
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  complemento?: string;
}