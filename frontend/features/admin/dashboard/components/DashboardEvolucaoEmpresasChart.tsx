"use client";

import { IconTrendingUp } from "@tabler/icons-react";
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

import { DashboardEvolucaoEmpresasPonto } from "@/domains/admin/dashboard/types/dashboard.responses";

const chartConfig = {
  novas: {
    label: "Novas empresas",
    color: "#10b981",
  },
} satisfies ChartConfig;

function formatarDataEixo(valor: string) {
  const [, mes, dia] = valor.split("-");
  return `${dia}/${mes}`;
}

interface Props {
  dados: DashboardEvolucaoEmpresasPonto[];
}

export function DashboardEvolucaoEmpresasChart({ dados }: Props) {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconTrendingUp className="size-6 text-emerald-500 dark:text-emerald-400" />
          Evolução de empresas cadastradas
        </CardTitle>
        <CardDescription>Novas empresas por dia no período selecionado</CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {dados.every((ponto) => ponto.novas === 0) ? (
          <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
            Nenhuma empresa cadastrada no período selecionado.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
            <AreaChart data={dados}>
              <defs>
                <linearGradient id="fillNovas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-novas)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-novas)" stopOpacity={0.1} />
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
                dataKey="novas"
                type="natural"
                fill="url(#fillNovas)"
                stroke="var(--color-novas)"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
