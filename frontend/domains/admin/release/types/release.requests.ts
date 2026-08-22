import { ReleaseContexto, ReleaseStatus, ReleaseTipo } from "./release.model";

export interface ListarReleasesRequest {
  contexto?: ReleaseContexto;
  status?: ReleaseStatus;
  tipo?: ReleaseTipo;
  page?: number;
  por_pagina?: number;
}

export interface CadastrarReleaseRequest {
  contexto: ReleaseContexto;
  titulo: string;
  conteudo: string;
  tipo: ReleaseTipo;
  versao: string;
}

export interface AtualizarReleaseRequest {
  contexto?: ReleaseContexto;
  titulo?: string;
  conteudo?: string;
  tipo?: ReleaseTipo;
  versao?: string;
}
