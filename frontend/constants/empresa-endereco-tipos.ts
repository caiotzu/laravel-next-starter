export const EMPRESA_ENDERECO_TIPOS = {
  COMERCIAL: "Comercial",
  FISCAL: "Fiscal",
  CORRESPONDENCIA: "Correspondencia",
  COBRANCA: "Cobranca",
  ENTREGA: "Entrega",
} as const;

export type EmpresaEnderecoTipo = keyof typeof EMPRESA_ENDERECO_TIPOS;

export const EMPRESA_ENDERECO_TIPO_OPTIONS = Object.entries(
  EMPRESA_ENDERECO_TIPOS
).map(([value, label]) => ({
  value: value as EmpresaEnderecoTipo,
  label,
}));

export function getEmpresaEnderecoTipoLabel(
  tipo: EmpresaEnderecoTipo
): string {
  return EMPRESA_ENDERECO_TIPOS[tipo];
}
