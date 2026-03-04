import { LaravelPagination } from "@/types/laravel";

import { GrupoEmpresa } from "../../grupo-empresa/types/grupoEmpresa.model";

import { Empresa } from "./empresa.model";

// export interface CadastrarEmpresaResponse {
//   id: string;
//   nome: string;
//   created_at: string;
//   updated_at: string | null;
// }

// export interface EditarEmpresaResponse {
//   id: string;
//   nome: string;
//   created_at: string;
//   updated_at: string | null;
// }

export type AtivarEmpresaResponse = Empresa;

export type EmpresaListaItem = Empresa & {
  grupo_empresa: GrupoEmpresa;
  matriz: Empresa | null;
};
export type ListarEmpresasResponse = LaravelPagination<EmpresaListaItem>


// export interface VisualizarEmpresaResponse extends Empresa {
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
//       ativo: boolean;
//       avatar: string | null;
//       google2fa_enable: boolean;
//       google2fa_secret: string | null;
//       created_at: string;
//       updated_at: string | null;
//       deleted_at: string | null;
//     }[];
//   }[];
// }