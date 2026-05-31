import { Usuario } from "../../usuario/types/usuario.model";

export interface Grupo {
  id: string;
  descricao: string;
  versao: string;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;

  usuarios: Usuario[]
}
