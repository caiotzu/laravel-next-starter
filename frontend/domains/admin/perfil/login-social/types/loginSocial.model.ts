export interface VinculoSocial {
  chave: string;
  nome: string;
  /** Provedor ativo e configurado. Se false, o vínculo só pode ser removido. */
  disponivel: boolean;
  vinculado: boolean;
  email: string | null;
  vinculadoEm: string | null;
  ultimoLoginEm: string | null;
}
