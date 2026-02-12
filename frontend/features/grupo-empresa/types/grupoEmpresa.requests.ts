export interface CadastrarGrupoEmpresaRequest {
  nome: string;
}

export interface EditarGrupoEmpresaRequest {
  nome: string;
}

export interface ListarGrupoEmpresasRequest {
  id?: string;
  nome?: string;
  excluido?: boolean;
  porPagina?: number;
  page?: number;
}


