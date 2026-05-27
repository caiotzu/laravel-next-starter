export const EMPRESA_STATUS_OPTIONS = [
  { value: "pendente", label: "Pendente" },
  { value: "ativo", label: "Ativo" },
  { value: "inativo", label: "Inativo" },
  { value: "bloqueado", label: "Bloqueado" },
] as const;

export type EmpresaStatusValue = (typeof EMPRESA_STATUS_OPTIONS)[number]["value"];

export function getEmpresaStatusLabel(status?: string | null) {
  return (
    EMPRESA_STATUS_OPTIONS.find((option) => option.value === status)?.label ??
    status ??
    ""
  );
}
