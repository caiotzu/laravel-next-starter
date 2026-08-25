export const CHAMADO_PRIORIDADE = {
  baixa: "Baixa",
  normal: "Normal",
  alta: "Alta",
  urgente: "Urgente",
} as const;

export type ChamadoPrioridade = keyof typeof CHAMADO_PRIORIDADE;

export const CHAMADO_PRIORIDADE_BADGE: Record<ChamadoPrioridade, string> = {
  baixa: "bg-slate-100 text-slate-700 dark:bg-slate-950/30 dark:text-slate-400",
  normal: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  alta: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  urgente: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400",
};

export function getChamadoPrioridadeLabel(prioridade: string): string {
  return CHAMADO_PRIORIDADE[prioridade as ChamadoPrioridade] ?? prioridade;
}

export function getChamadoPrioridadeBadge(prioridade: string): string {
  return (
    CHAMADO_PRIORIDADE_BADGE[prioridade as ChamadoPrioridade] ??
    "bg-slate-100 text-slate-700 dark:bg-slate-950/30 dark:text-slate-400"
  );
}

/**
 * Espelha config('api.chamados') do backend — usado só para feedback
 * imediato no formulário (desabilitar o botão de anexar, avisar antes de
 * enviar). A validação que realmente decide é sempre a do backend (ver
 * Http\Requests\Private\Chamado\AbrirRequest::withValidator); mudar aqui
 * sem mudar lá não afrouxa nada no servidor.
 */
export const CHAMADO_ANEXO_TAMANHO_MAXIMO_KB = 10240; // 10MB
export const CHAMADO_ANEXO_MIMES = ["application/pdf", "image/jpeg", "image/png"];
export const CHAMADO_ANEXO_EXTENSOES = [".pdf", ".jpg", ".jpeg", ".png"];
export const CHAMADO_ANEXOS_MAXIMO_POR_MENSAGEM = 5;
