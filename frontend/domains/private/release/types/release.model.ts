export type ReleaseTipo = "feature" | "improvement" | "fix" | "change";

export interface Release {
  id: string;
  titulo: string;
  conteudo: string;
  tipo: ReleaseTipo;
  tipoLabel: string;
  versao: string;
  publicadoEm: string | null;
}
