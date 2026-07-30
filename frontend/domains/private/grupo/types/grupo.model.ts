import { Permissao } from "../../permissao/types/permissao.model";
import { Usuario } from "../../usuario/types/usuario.model";

export interface Grupo {
  id: string;
  descricao: string;
  versao?: number;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;

  usuarios?: Usuario[],
  permissoes?: Permissao[],
}
