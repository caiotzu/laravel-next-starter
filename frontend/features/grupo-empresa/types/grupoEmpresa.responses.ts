import { LaravelPagination } from "@/types/laravel";

import { GrupoEmpresa } from "./grupoEmpresa.model";

export interface CadastrarGrupoEmpresaResponse {
  id: string;
  nome: string;
  created_at: string;
  updated_at: string;
}

export type ListarGrupoEmpresasResponse = LaravelPagination<GrupoEmpresa>;
