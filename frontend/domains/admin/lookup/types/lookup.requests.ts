export interface ListarMunicipiosRequest {
  nome?: string;
  uf?: string;
  codigo_ibge?: string;
  codigo_siafi?: string;
  por_pagina?: number;
  page?: number;
}
