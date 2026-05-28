export const EMPRESA_STATUS = {
  pendente: "Pendente",
  ativo: "Ativo",
  inativo: "Inativo",
  bloqueado: "Bloqueado",
} as const;

export type EmpresaStatus = keyof typeof EMPRESA_STATUS;

export const EMPRESA_STATUS_OPTIONS = Object.entries(
  EMPRESA_STATUS
).map(([value, label]) => ({
  value: value as EmpresaStatus,
  label,
}));

export function getEmpresaStatusLabel(
  tipo: EmpresaStatus
): string {
  return EMPRESA_STATUS[tipo];
}
