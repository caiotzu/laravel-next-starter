export interface Grupo {
  id: string;
  descricao: string;
  versao: string;
  entidade_tipo_id: string;
  entidade_id: string;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
}
