"use client";

import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { ApiErrorResponse } from "@/types/errors";

import { listarRegistrosEntidadeAuditavel } from "../services/auditoriaService";
import {
  AuditoriaEntidadeRegistro,
  ListarRegistrosAuditoriaEntidadeRequest,
} from "../types/auditoria-entidade";

export function useAuditoriaEntidadeRegistros(
  entidade: string | undefined,
  params: ListarRegistrosAuditoriaEntidadeRequest,
) {
  return useQuery<AuditoriaEntidadeRegistro[], AxiosError<ApiErrorResponse>>({
    queryKey: ["auditoria-entidade-registros", entidade, params],
    queryFn: () => listarRegistrosEntidadeAuditavel(entidade!, params),
    enabled: Boolean(entidade),
    placeholderData: (previousData) => previousData,
  });
}
