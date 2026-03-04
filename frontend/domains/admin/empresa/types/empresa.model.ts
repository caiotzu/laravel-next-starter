export interface Empresa {
  id: string;
  grupo_empresa_id: string;
  matriz_id: string;
  cnpj: string;
  nome_fantasia: string;
  razao_social: string;
  inscricao_estadual: string;
  inscricao_municipal: string;
  ativo: boolean;
  uf: string;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
}