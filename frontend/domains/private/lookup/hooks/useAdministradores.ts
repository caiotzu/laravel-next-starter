"use client";

import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { ApiErrorResponse } from "@/types/errors";

import { listarAdministradores } from "../services/lookupService";
import { ListarAdministradoresRequest } from "../types/lookup.requests";
import { AdministradorLookupItem } from "../types/lookup.responses";

export function useAdministradores(
  params: ListarAdministradoresRequest,
  enabled = true
) {
  return useQuery<AdministradorLookupItem[], AxiosError<ApiErrorResponse>>({
    queryKey: ["lookup-administradores", params],
    queryFn: () => listarAdministradores(params),
    enabled,
    placeholderData: (previousData) => previousData,
  });
}
