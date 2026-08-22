export type ReleaseTipo = "feature" | "improvement" | "fix" | "change";
export type ReleaseStatus = "draft" | "published";
export type ReleaseContexto = "admin" | "private";

export interface Release {
  id: string;
  contexto: ReleaseContexto | null;
  titulo: string;
  conteudo: string;
  tipo: ReleaseTipo;
  tipoLabel: string;
  versao: string;
  status: ReleaseStatus;
  publicadoEm: string | null;
  createdAt: string;
  updatedAt: string;
}
