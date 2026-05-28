export interface Empresa {
  id: string;
  grupo_empresa_id: string;
  matriz_id: string | null;
  cnpj: string;
  nome_fantasia: string;
  razao_social: string;
  inscricao_estadual: string | null;
  inscricao_municipal: string | null;
  status: string;
  uf: string;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
}
