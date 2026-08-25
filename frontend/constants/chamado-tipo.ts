import { Wallet, Monitor, KeyRound, HelpCircle, FileText, Wrench, MoreHorizontal, type LucideIcon } from "lucide-react";

export const CHAMADO_TIPO = {
  financeiro: "Financeiro",
  plataforma: "Problema na plataforma",
  acesso: "Dificuldade de acesso",
  duvida: "Dúvida",
  documentacao: "Documentação",
  operacional: "Problema operacional",
  outros: "Outros",
} as const;

export type ChamadoTipo = keyof typeof CHAMADO_TIPO;

export const CHAMADO_TIPO_ICON: Record<ChamadoTipo, LucideIcon> = {
  financeiro: Wallet,
  plataforma: Monitor,
  acesso: KeyRound,
  duvida: HelpCircle,
  documentacao: FileText,
  operacional: Wrench,
  outros: MoreHorizontal,
};

export const CHAMADO_TIPO_OPTIONS = Object.entries(CHAMADO_TIPO).map(
  ([value, label]) => ({ value: value as ChamadoTipo, label })
);

export function getChamadoTipoLabel(tipo: string): string {
  return CHAMADO_TIPO[tipo as ChamadoTipo] ?? tipo;
}

export function getChamadoTipoIcon(tipo: string): LucideIcon {
  return CHAMADO_TIPO_ICON[tipo as ChamadoTipo] ?? MoreHorizontal;
}
