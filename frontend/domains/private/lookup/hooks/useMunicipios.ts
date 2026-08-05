"use client";

import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { ApiErrorResponse } from "@/types/errors";

import { listarMunicipios } from "../services/lookupService";
import { ListarMunicipiosRequest } from "../types/lookup.requests";
import { MunicipioLookupItem } from "../types/lookup.responses";

export function useMunicipios(
  params: ListarMunicipiosRequest,
  enabled = true
) {
  return useQuery<MunicipioLookupItem[], AxiosError<ApiErrorResponse>>({
    queryKey: ["lookup-municipios", params],
    queryFn: () => listarMunicipios(params),
    enabled,
    placeholderData: (previousData) => previousData,
  });
}
