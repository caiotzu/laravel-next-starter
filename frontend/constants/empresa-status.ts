export const EMPRESA_STATUS = {
  pendente: "Pendente",
  ativo: "Ativo",
  inativo: "Inativo",
  bloqueado: "Bloqueado",
} as const;

export type EmpresaStatus = keyof typeof EMPRESA_STATUS;

export const EMPRESA_STATUS_BORDER:
  Record<EmpresaStatus, string> = {
    pendente: "border-amber-500",
    ativo: "border-emerald-500",
    inativo: "border-zinc-500",
    bloqueado: "border-red-500",
  };

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

export function getEmpresaStatusBorder(
  status: EmpresaStatus
): string {
  return EMPRESA_STATUS_BORDER[
    status
  ];
}
