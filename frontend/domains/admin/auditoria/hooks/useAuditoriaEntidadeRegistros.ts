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
  options?: { enabled?: boolean },
) {
  return useQuery<AuditoriaEntidadeRegistro[], AxiosError<ApiErrorResponse>>({
    queryKey: ["auditoria-entidade-registros", entidade, params],
    queryFn: () => listarRegistrosEntidadeAuditavel(entidade!, params),
    enabled: Boolean(entidade) && (options?.enabled ?? true),
    // Só reaproveita o resultado anterior como placeholder enquanto a busca
    // é refeita para a MESMA entidade; evita mostrar por um instante
    // registros de uma entidade diferente da que está selecionada agora.
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[1] === entidade ? previousData : undefined,
  });
}
