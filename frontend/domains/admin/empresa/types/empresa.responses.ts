import { LaravelResourcePagination } from "@/types/laravel";

import { EmpresaContatoResponse } from "../../empresa-contato/types/empresaContato.responses";
import { EmpresaEnderecoResponse } from "../../empresa-endereco/types/empresaEndereco.responses";
import { GrupoEmpresa } from "../../grupo-empresa/types/grupoEmpresa.model";

import { Empresa } from "./empresa.model";


export type CadastrarEmpresaResponse = Empresa;

export type EditarEmpresaResponse = Empresa;

export type AtivarEmpresaResponse = Empresa;

export type EmpresaListaItem = Empresa & {
  grupo_empresa: GrupoEmpresa;
  matriz: Empresa | null;
};
export type ListarEmpresasResponse = LaravelResourcePagination<EmpresaListaItem>


export interface VisualizarEmpresaResponse extends Empresa {
  grupo_empresa: GrupoEmpresa;
  matriz?: Empresa | null;
  contatos: EmpresaContatoResponse[];
  enderecos: EmpresaEnderecoResponse[];
}
