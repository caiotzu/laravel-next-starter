import { ListarEmpresasRequest } from "./empresa.requests";

export interface EmpresaFilters extends ListarEmpresasRequest {
  matriz_nome?: string;
}