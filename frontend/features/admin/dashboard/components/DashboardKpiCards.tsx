"use client";

import {
  IconTrendingDown,
  IconTrendingUp,
  IconBuilding,
  IconTicket,
  IconClipboardList,
  IconCircleCheck,
  IconClock,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { DashboardKpis } from "@/domains/admin/dashboard/types/dashboard.responses";
import { formatDuration } from "@/lib/utils";


interface Props {
  kpis: DashboardKpis;
}

function TendenciaBadge({ percentual }: { percentual: number | null }) {
  if (percentual === null) return null;

  const positivo = percentual >= 0;
  const Icon = positivo ? IconTrendingUp : IconTrendingDown;

  return (
    <Badge
      className={
        positivo
          ? "gap-1 rounded-full font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
          : "gap-1 rounded-full font-medium bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400"
      }
    >
      <Icon strokeWidth={2.5} className="size-3.5" />
      {positivo ? "+" : ""}
      {percentual}%
    </Badge>
  );
}

function IconChip({
  icon: Icon,
  className,
}: {
  icon: typeof IconBuilding;
  className: string;
}) {
  return (
    <span
      className={`flex size-8 shrink-0 items-center justify-center rounded-md ${className}`}
    >
      <Icon className="size-4" />
    </span>
  );
}

export function DashboardKpiCards({ kpis }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-5">
      <Card className="@container/card gap-0 border-l-4 border-l-sky-500 dark:border-l-sky-400">
        <CardHeader className="gap-2">
          <div className="flex items-center gap-2">
            <IconChip
              icon={IconBuilding}
              className="bg-sky-500/10 text-sky-600 dark:bg-sky-400/10 dark:text-sky-400"
            />
            <CardDescription className="text-sm font-medium">
              Empresas cadastradas
            </CardDescription>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight tabular-nums @[250px]/card:text-3xl">
            {kpis.total_empresas}
          </CardTitle>
          <CardAction>
            <TendenciaBadge percentual={kpis.empresas_variacao_percentual} />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">
            {kpis.empresas_no_periodo} novas no período
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card gap-0 border-l-4 border-l-amber-500 dark:border-l-amber-400">
        <CardHeader className="gap-2">
          <div className="flex items-center gap-2">
            <IconChip
              icon={IconTicket}
              className="bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400"
            />
            <CardDescription className="text-sm font-medium">
              Chamados em aberto
            </CardDescription>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight tabular-nums @[250px]/card:text-3xl">
            {kpis.chamados_abertos}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">
            Total aguardando alguma ação
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card gap-0 border-l-4 border-l-violet-500 dark:border-l-violet-400">
        <CardHeader className="gap-2">
          <div className="flex items-center gap-2">
            <IconChip
              icon={IconClipboardList}
              className="bg-violet-500/10 text-violet-600 dark:bg-violet-400/10 dark:text-violet-400"
            />
            <CardDescription className="text-sm font-medium">
              Chamados no período
            </CardDescription>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight tabular-nums @[250px]/card:text-3xl">
            {kpis.chamados_no_periodo}
          </CardTitle>
          <CardAction>
            <TendenciaBadge percentual={kpis.chamados_variacao_percentual} />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">
            Comparado ao período anterior
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card gap-0 border-l-4 border-l-emerald-500 dark:border-l-emerald-400">
        <CardHeader className="gap-2">
          <div className="flex items-center gap-2">
            <IconChip
              icon={IconCircleCheck}
              className="bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400"
            />
            <CardDescription className="text-sm font-medium">
              Chamados fechados no período
            </CardDescription>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight tabular-nums @[250px]/card:text-3xl">
            {kpis.chamados_fechados_no_periodo}
          </CardTitle>
          <CardAction>
            <TendenciaBadge percentual={kpis.chamados_fechados_variacao_percentual} />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">
            Comparado ao período anterior
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card gap-0 border-l-4 border-l-cyan-500 dark:border-l-cyan-400">
        <CardHeader className="gap-2">
          <div className="flex items-center gap-2">
            <IconChip
              icon={IconClock}
              className="bg-cyan-500/10 text-cyan-600 dark:bg-cyan-400/10 dark:text-cyan-400"
            />
            <CardDescription className="text-sm font-medium">
              Tempo médio de resolução
            </CardDescription>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight tabular-nums @[250px]/card:text-3xl">
            {formatDuration(kpis.tempo_medio_resolucao_segundos)}
          </CardTitle>
          <CardAction>
            <TendenciaBadge percentual={kpis.tempo_medio_resolucao_variacao_percentual} />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">
            Entre abertura e fechamento, no período
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
