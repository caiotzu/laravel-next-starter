import { LaravelResourcePagination } from "@/types/laravel";

import { ReleaseTipo } from "./release.model";

export interface ReleaseDataResponse {
  id: string;
  titulo: string;
  conteudo: string;
  tipo: ReleaseTipo;
  tipo_label: string;
  versao: string;
  publicado_em: string | null;
}

export type ListarReleasesResponse = LaravelResourcePagination<ReleaseDataResponse>;
