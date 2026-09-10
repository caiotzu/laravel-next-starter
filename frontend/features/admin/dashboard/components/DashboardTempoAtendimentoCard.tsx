"use client";

import { Timer } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { DashboardTempoAtendimento } from "@/domains/admin/dashboard/types/dashboard.responses";
import { formatDuration } from "@/lib/utils";


interface Props {
  tempo: DashboardTempoAtendimento;
}

export function DashboardTempoAtendimentoCard({ tempo }: Props) {
  const semAmostrasResolucao = tempo.resolucao.amostras === 0;
  const semAmostrasResposta = tempo.primeira_resposta.amostras === 0;

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="size-4" />
          Tempo de atendimento
        </CardTitle>
        <CardDescription>
          Considera apenas chamados com a data correspondente já registrada
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 @lg/card:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Tempo médio de resolução</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {semAmostrasResolucao ? "---" : formatDuration(tempo.resolucao.media_segundos)}
            </p>
            {!semAmostrasResolucao && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {tempo.resolucao.amostras} chamado{tempo.resolucao.amostras === 1 ? "" : "s"} fechado{tempo.resolucao.amostras === 1 ? "" : "s"}
              </p>
            )}
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Tempo mediano de resolução</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {semAmostrasResolucao ? "---" : formatDuration(tempo.resolucao.mediana_segundos)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Menos sensível a casos extremos
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Tempo até primeira resposta</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {semAmostrasResposta ? "---" : formatDuration(tempo.primeira_resposta.media_segundos)}
            </p>
            {!semAmostrasResposta && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {tempo.primeira_resposta.amostras} chamado{tempo.primeira_resposta.amostras === 1 ? "" : "s"} com resposta
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
