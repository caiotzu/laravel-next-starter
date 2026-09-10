"use client";

import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";

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
    <Badge variant="outline">
      <Icon />
      {positivo ? "+" : ""}
      {percentual}%
    </Badge>
  );
}

export function DashboardKpiCards({ kpis }: Props) {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-5">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Empresas cadastradas</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
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

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Chamados em aberto</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {kpis.chamados_abertos}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">
            Total aguardando alguma ação
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Chamados no período</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
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

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Chamados fechados no período</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
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

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Tempo médio de resolução</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
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
