import { UsuarioStatus } from "@/constants/usuario-status";

import { Grupo } from "../../grupo/types/grupo.model";

export interface UsuarioGrupoEmpresa {
  id: string;
  grupoId: string;
  nome: string;
  email: string;
  status: UsuarioStatus;
  avatar: string | null;
  google2faEnable: boolean | null;
  google2faConfirmadoEm: string | null;
  ultimoLoginEm: string | null;
  ultimoIp: string | null;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;

  // relacionamentos
  grupo?: Grupo
}
