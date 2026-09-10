"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { getChamadoPrioridadeBadge, getChamadoPrioridadeLabel } from "@/constants/chamado-prioridade";
import { getChamadoStatusBadge, getChamadoStatusLabel } from "@/constants/chamado-status";
import { getChamadoTipoLabel } from "@/constants/chamado-tipo";

type Dimensao = "status" | "prioridade" | "tipo";

interface Props {
  titulo: string;
  descricao: string;
  dados: Record<string, number>;
  dimensao: Dimensao;
}

function getLabel(dimensao: Dimensao, chave: string): string {
  if (dimensao === "status") return getChamadoStatusLabel(chave);
  if (dimensao === "prioridade") return getChamadoPrioridadeLabel(chave);
  return getChamadoTipoLabel(chave);
}

function getBadgeClass(dimensao: Dimensao, chave: string): string {
  if (dimensao === "status") return getChamadoStatusBadge(chave);
  if (dimensao === "prioridade") return getChamadoPrioridadeBadge(chave);
  return "bg-slate-100 text-slate-700 dark:bg-slate-950/30 dark:text-slate-400";
}

/**
 * Reaproveita os mesmos getX Label/Badge já centralizados para Chamado
 * (ver constants/chamado-*.ts) — nenhuma cor/label nova foi inventada
 * aqui, é a mesma configuração usada nas telas de Chamados.
 */
export function DashboardDistribuicaoChamados({ titulo, descricao, dados, dimensao }: Props) {
  const entradas = Object.entries(dados).sort(([, a], [, b]) => b - a);
  const total = entradas.reduce((soma, [, valor]) => soma + valor, 0);

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>{titulo}</CardTitle>
        <CardDescription>{descricao}</CardDescription>
      </CardHeader>
      <CardContent>
        {entradas.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhum chamado no período selecionado.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {entradas.map(([chave, valor]) => {
              const percentual = total > 0 ? Math.round((valor / total) * 100) : 0;

              return (
                <div key={chave} className="flex items-center gap-3">
                  <span
                    className={`w-32 shrink-0 truncate rounded px-2 py-0.5 text-center text-xs font-medium ${getBadgeClass(dimensao, chave)}`}
                  >
                    {getLabel(dimensao, chave)}
                  </span>

                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${percentual}%` }}
                    />
                  </div>

                  <span className="w-10 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
                    {valor}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
