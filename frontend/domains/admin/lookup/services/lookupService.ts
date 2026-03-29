import qs from "qs";

import { proxyAdminRequest } from "@/lib/proxy-admin";

import { ListarMunicipiosRequest } from "../types/lookup.requests";
import { ConsultarCepResponse, ListarMunicipiosResponse } from "../types/lookup.responses";

export function listarMunicipios(params: ListarMunicipiosRequest) {
  const query = qs.stringify(params, { skipNulls: true });

  return proxyAdminRequest<ListarMunicipiosResponse>({
    url: `/lookup/municipios?${query}`,
    method: "GET",
  });
}

export function consultarCep(cep: string) {
  return proxyAdminRequest<ConsultarCepResponse>({
    url: `/lookup/ceps/${cep}`,
    method: "GET",
  });
}
