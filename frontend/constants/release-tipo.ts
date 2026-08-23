import { Sparkles, Rocket, CodeXml, PencilLine, type LucideIcon } from "lucide-react";

export const RELEASE_TIPO = {
  feature: "Novidade",
  improvement: "Melhoria",
  fix: "Correção",
  change: "Alteração",
} as const;

export type ReleaseTipo = keyof typeof RELEASE_TIPO;

export const RELEASE_TIPO_ICON: Record<ReleaseTipo, LucideIcon> = {
  feature: Sparkles,
  improvement: Rocket,
  fix: CodeXml,
  change: PencilLine,
};

// Mesma família de cor do ícone correspondente, no padrão bg-*/text-*/dark:*
// já usado em outros Badges do projeto (ver AUDITORIA_ACAO_BADGE,
// MensagemView "bg-indigo-100 dark:bg-indigo-950/30 ...").
export const RELEASE_TIPO_BADGE: Record<ReleaseTipo, string> = {
  feature: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  improvement: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  fix: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  change: "bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400",
};

export const RELEASE_TIPO_OPTIONS = Object.entries(RELEASE_TIPO).map(
  ([value, label]) => ({
    value: value as ReleaseTipo,
    label,
  })
);

export function getReleaseTipoLabel(tipo: string): string {
  return RELEASE_TIPO[tipo as ReleaseTipo] ?? tipo;
}

export function getReleaseTipoBadge(tipo: string): string {
  return (
    RELEASE_TIPO_BADGE[tipo as ReleaseTipo] ??
    "bg-slate-100 text-slate-700 dark:bg-slate-950/30 dark:text-slate-400"
  );
}

export function getReleaseTipoIcon(tipo: string): LucideIcon {
  return RELEASE_TIPO_ICON[tipo as ReleaseTipo] ?? PencilLine;
}
