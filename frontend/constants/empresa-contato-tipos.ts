export const EMPRESA_CONTATO_TIPOS = {
  E: "E-mail",
  T: "Telefone",
} as const;

export type EmpresaContatoTipo = keyof typeof EMPRESA_CONTATO_TIPOS;

export const EMPRESA_CONTATO_TIPO_OPTIONS = Object.entries(
  EMPRESA_CONTATO_TIPOS
).map(([value, label]) => ({
  value: value as EmpresaContatoTipo,
  label,
}));

export function getEmpresaContatoTipoLabel(
  tipo: EmpresaContatoTipo
): string {
  return EMPRESA_CONTATO_TIPOS[tipo];
}
