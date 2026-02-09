export interface CadastrarGrupoEmpresaRequest {
  nome: string;
}

export interface EditarGrupoEmpresaRequest {
  nome: string;
}

export interface ListarGrupoEmpresasRequest {
  id?: string;
  nome?: string;
  porPagina?: number;
  page?: number;
}


