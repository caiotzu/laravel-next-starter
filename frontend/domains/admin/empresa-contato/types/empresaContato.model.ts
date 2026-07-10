export interface EmpresaContato {
  id: string;
  empresaId: string;
  tipo: string;
  valor: string;
  ativo: boolean;
  principal: boolean;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
}
