"use client";

import { IconTicket } from "@tabler/icons-react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import { DashboardEvolucaoChamadosPonto } from "@/domains/admin/dashboard/types/dashboard.responses";

const chartConfig = {
  abertos: {
    label: "Abertos",
    color: "#f59e0b",
  },
  fechados: {
    label: "Fechados",
    color: "#10b981",
  },
} satisfies ChartConfig;

function formatarDataEixo(valor: string) {
  const [, mes, dia] = valor.split("-");
  return `${dia}/${mes}`;
}

interface Props {
  dados: DashboardEvolucaoChamadosPonto[];
}

export function DashboardEvolucaoChamadosChart({ dados }: Props) {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconTicket className="size-6 text-amber-500 dark:text-amber-400" />
          Chamados abertos x fechados
        </CardTitle>
        <CardDescription>Evolução diária no período selecionado</CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {dados.every((ponto) => ponto.abertos === 0 && ponto.fechados === 0) ? (
          <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
            Nenhum chamado no período selecionado.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
            <AreaChart data={dados}>
              <defs>
                <linearGradient id="fillAbertos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-abertos)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-abertos)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillFechados" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-fechados)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-fechados)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="data"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={formatarDataEixo}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => formatarDataEixo(String(value))}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="abertos"
                type="natural"
                fill="url(#fillAbertos)"
                stroke="var(--color-abertos)"
              />
              <Area
                dataKey="fechados"
                type="natural"
                fill="url(#fillFechados)"
                stroke="var(--color-fechados)"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
