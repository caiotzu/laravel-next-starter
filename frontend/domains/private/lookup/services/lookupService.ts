import qs from "qs";

import { proxyPrivateRequest } from "@/lib/proxy-private";

import { ListarMunicipiosRequest } from "../types/lookup.requests";
import { ConsultarCepResponse, ListarMunicipiosResponse } from "../types/lookup.responses";

function uniqueMunicipiosById(items: ListarMunicipiosResponse["data"]) {
  return items.filter(
    (item, index, array) => array.findIndex((current) => current.id === item.id) === index
  );
}

export async function listarMunicipios(params: ListarMunicipiosRequest) {
  const query = qs.stringify(params, { skipNulls: true });

  const response = await proxyPrivateRequest<ListarMunicipiosResponse>({
    url: `/lookup/municipios?${query}`,
    method: "GET",
  });
  return uniqueMunicipiosById(response.data.data);
}

export async function consultarCep(cep: string) {
  const response = await proxyPrivateRequest<ConsultarCepResponse>({
    url: `/lookup/ceps/${cep}`,
    method: "GET",
  });

  return response.data.data;
}
