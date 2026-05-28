export interface EmpresaContatoResponse {
  id: string;
  empresa_id: string;
  tipo: string;
  tipo_descricao: string;
  valor: string;
  ativo: boolean;
  principal: boolean;
  created_at: string;
  updated_at: string | null;
}