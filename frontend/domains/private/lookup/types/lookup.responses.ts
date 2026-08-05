import { LaravelPagination } from "@/types/laravel";

export interface MunicipioLookupItem {
  id: string;
  nome: string;
  uf: string;
  codigo_ibge: string;
  codigo_siafi: string;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
}

export type ListarMunicipiosResponse = LaravelPagination<MunicipioLookupItem>;

export interface ConsultarCepResponse {
  cep: string;
  logradouro: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  ibge: string | null;
  siafi: string | null;
  encontrado: boolean;
  provider: string;
}
