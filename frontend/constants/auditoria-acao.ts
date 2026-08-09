export const AUDITORIA_ACAO = {
  cadastro: "Cadastro",
  atualizacao: "Atualização",
  exclusao: "Exclusão",
  restauracao: "Restauração",
} as const;

export type AuditoriaAcao = keyof typeof AUDITORIA_ACAO;

export const AUDITORIA_ACAO_BADGE:
  Record<AuditoriaAcao, string> = {
    cadastro: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
    atualizacao: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
    exclusao: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400",
    restauracao: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  };

export const AUDITORIA_ACAO_OPTIONS = Object.entries(
  AUDITORIA_ACAO
).map(([value, label]) => ({
  value: value as AuditoriaAcao,
  label,
}));

export function getAuditoriaAcaoLabel(
  acao: string
): string {
  return AUDITORIA_ACAO[acao as AuditoriaAcao] ?? acao;
}

export function getAuditoriaAcaoBadge(
  acao: string
): string {
  return AUDITORIA_ACAO_BADGE[acao as AuditoriaAcao] ?? "bg-slate-100 text-slate-700";
}
