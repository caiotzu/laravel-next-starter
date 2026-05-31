import { Grupo } from "../../grupo/types/grupo.model";

export interface GrupoEmpresa {
  id: string;
  nome: string;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;

  grupos: Grupo[];
}
