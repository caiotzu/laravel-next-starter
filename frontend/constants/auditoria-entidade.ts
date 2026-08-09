export const AUDITORIA_ENTIDADE = {
  empresas: "Empresa",
  empresa_contatos: "Contato da Empresa",
  empresa_enderecos: "Endereço da Empresa",
  grupos: "Grupo",
  usuarios: "Usuário"
} as const;

export type AuditoriaEntidade = keyof typeof AUDITORIA_ENTIDADE;

export const AUDITORIA_ENTIDADE_OPTIONS = Object.entries(
  AUDITORIA_ENTIDADE
).map(([value, label]) => ({
  value: value as AuditoriaEntidade,
  label,
}));

export function getAuditoriaEntidadeLabel(
  entidade: string
): string {
  return AUDITORIA_ENTIDADE[entidade as AuditoriaEntidade] ?? entidade;
}
