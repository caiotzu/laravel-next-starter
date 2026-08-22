import { LaravelResourcePagination } from "@/types/laravel";

import { ReleaseContexto, ReleaseStatus, ReleaseTipo } from "./release.model";

export interface ReleaseDataResponse {
  id: string;
  contexto: ReleaseContexto | null;
  titulo: string;
  conteudo: string;
  tipo: ReleaseTipo;
  tipo_label: string;
  versao: string;
  status: ReleaseStatus;
  publicado_em: string | null;
  created_at: string;
  updated_at: string;
}

export type ListarReleasesResponse = LaravelResourcePagination<ReleaseDataResponse>;
