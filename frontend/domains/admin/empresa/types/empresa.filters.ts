import { ListarEmpresasRequest } from "./empresa.requests";

export interface EmpresaFilters extends ListarEmpresasRequest {
  grupo_empresa_nome?: string;
  matriz_nome?: string;
}