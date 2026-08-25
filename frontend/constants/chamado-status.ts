import { Circle, UserCog, Clock, AlarmClock, CheckCircle2, XCircle, Ban, type LucideIcon } from "lucide-react";

export const CHAMADO_STATUS = {
  aberto: "Aberto",
  em_atendimento: "Em atendimento",
  aguardando_cliente: "Aguardando cliente",
  aguardando_suporte: "Aguardando suporte",
  resolvido: "Resolvido",
  fechado: "Fechado",
  cancelado: "Cancelado",
} as const;

export type ChamadoStatus = keyof typeof CHAMADO_STATUS;

export const CHAMADO_STATUS_ICON: Record<ChamadoStatus, LucideIcon> = {
  aberto: Circle,
  em_atendimento: UserCog,
  aguardando_cliente: Clock,
  aguardando_suporte: AlarmClock,
  resolvido: CheckCircle2,
  fechado: XCircle,
  cancelado: Ban,
};

// Mesmo padrão bg-*/text-*/dark:* usado em outros Badges do projeto (ver
// constants/release-tipo.ts).
export const CHAMADO_STATUS_BADGE: Record<ChamadoStatus, string> = {
  aberto: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  em_atendimento: "bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400",
  aguardando_cliente: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  aguardando_suporte: "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400",
  resolvido: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  fechado: "bg-slate-100 text-slate-700 dark:bg-slate-950/30 dark:text-slate-400",
  cancelado: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400",
};

// Status que "fecham" o chamado de fato — não usado hoje na UI, mantido
// caso volte a ser necessário distinguir de bloqueiaMensagens.
export const CHAMADO_STATUS_ENCERRADO: ChamadoStatus[] = ["fechado", "cancelado"];

// Status que bloqueiam o envio de novas mensagens (mesma regra do backend
// — ver App\Enums\ChamadoStatus::bloqueiaMensagens(), fonte da verdade).
// Resolvido também bloqueia, além dos que encerram o chamado.
export const CHAMADO_STATUS_BLOQUEIA_MENSAGENS: ChamadoStatus[] = ["resolvido", "fechado", "cancelado"];

export const CHAMADO_STATUS_OPTIONS = Object.entries(CHAMADO_STATUS).map(
  ([value, label]) => ({ value: value as ChamadoStatus, label })
);

export function getChamadoStatusLabel(status: string): string {
  return CHAMADO_STATUS[status as ChamadoStatus] ?? status;
}

export function getChamadoStatusIcon(status: string): LucideIcon {
  return CHAMADO_STATUS_ICON[status as ChamadoStatus] ?? Circle;
}

export function getChamadoStatusBadge(status: string): string {
  return (
    CHAMADO_STATUS_BADGE[status as ChamadoStatus] ??
    "bg-slate-100 text-slate-700 dark:bg-slate-950/30 dark:text-slate-400"
  );
}

export function chamadoEstaEncerrado(status: string): boolean {
  return CHAMADO_STATUS_ENCERRADO.includes(status as ChamadoStatus);
}

export function chamadoBloqueiaMensagens(status: string): boolean {
  return CHAMADO_STATUS_BLOQUEIA_MENSAGENS.includes(status as ChamadoStatus);
}
