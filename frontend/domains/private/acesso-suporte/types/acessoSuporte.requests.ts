export interface ConcederAcessoSuporteRequest {
  usuario_admin_id: string;
  duracao_minutos: number;
  motivo?: string;
  empresa_id?: string;
}
