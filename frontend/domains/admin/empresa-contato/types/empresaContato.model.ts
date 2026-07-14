import { EmpresaContatoTipo } from "@/constants/empresa-contato-tipos";

export interface EmpresaContato {
  id: string;
  empresaId: string;
  tipo: EmpresaContatoTipo;
  valor: string;
  ativo: boolean;
  principal: boolean;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
}
