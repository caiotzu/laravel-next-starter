import { LaravelApiResponse, LaravelResourcePagination } from "@/types/laravel";

import { Grupo } from "../../grupo/types/grupo.model";
import { grupoDataResponse } from "../../grupo/types/grupo.responses";

export interface GrupoEmpresaDataResponse {
  id: string;
  nome: string;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;

  grupos?: grupoDataResponse[]
}

// export interface VisualizarGrupoEmpresaData extends GrupoEmpresaDataResponse {
//   grupos: {
//     id: string;
//     descricao: string;
//     versao: number;
//     entidade_tipo_id: string;
//     entidade_id: string;
//     created_at: string;
//     updated_at: string | null;
//     deleted_at: string | null;

//     usuarios: {
//       id: string;
//       grupo_id: string;
//       nome: string;
//       email: string;
//       status: string;
//       avatar: string | null;
//       google2fa_enable: boolean;
//       google2fa_secret: string | null;
//       created_at: string;
//       updated_at: string | null;
//       deleted_at: string | null;
//     }[];
//   }[];
// }

export type CadastrarGrupoEmpresaResponse = LaravelApiResponse<GrupoEmpresaDataResponse>;
export type EditarGrupoEmpresaResponse = LaravelApiResponse<GrupoEmpresaDataResponse>;
export type ListarGrupoEmpresasResponse = LaravelResourcePagination<GrupoEmpresaDataResponse>;
export type AtivarGrupoEmpresaResponse = LaravelApiResponse<GrupoEmpresaDataResponse>;
export type VisualizarGrupoEmpresaResponse = LaravelApiResponse<GrupoEmpresaDataResponse>;
// export type VisualizarGrupoEmpresaResponse = LaravelApiResponse<VisualizarGrupoEmpresaData>;