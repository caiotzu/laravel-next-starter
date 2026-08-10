"use client";

import { useQuery } from "@tanstack/react-query";

import { listarEntidadesAuditaveis } from "../services/auditoriaService";

export function useAuditoriaEntidades() {
  return useQuery({
    queryKey: ["auditoria-entidades"],
    queryFn: listarEntidadesAuditaveis,
  });
}
