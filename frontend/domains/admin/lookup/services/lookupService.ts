import qs from "qs";

import { proxyAdminRequest } from "@/lib/proxy-admin";

import { ListarMunicipiosRequest, ListarAdministradoresRequest } from "../types/lookup.requests";
import { ConsultarCepResponse, ListarMunicipiosResponse, ListarAdministradoresResponse } from "../types/lookup.responses";

function uniqueMunicipiosById(items: ListarMunicipiosResponse["data"]) {
  return items.filter(
    (item, index, array) => array.findIndex((current) => current.id === item.id) === index
  );
}

export async function listarMunicipios(params: ListarMunicipiosRequest) {
  const query = qs.stringify(params, { skipNulls: true });

  const response = await proxyAdminRequest<ListarMunicipiosResponse>({
    url: `/lookup/municipios?${query}`,
    method: "GET",
  });
  return uniqueMunicipiosById(response.data.data);
}

export async function consultarCep(cep: string) {
  const response = await proxyAdminRequest<ConsultarCepResponse>({
    url: `/lookup/ceps/${cep}`,
    method: "GET",
  });
  return response.data.data;
}

export async function listarAdministradores(params: ListarAdministradoresRequest) {
  const query = qs.stringify(params, { skipNulls: true });

  const response = await proxyAdminRequest<ListarAdministradoresResponse>({
    url: `/lookup/administradores?${query}`,
    method: "GET",
  });

  return response.data.data;
}
