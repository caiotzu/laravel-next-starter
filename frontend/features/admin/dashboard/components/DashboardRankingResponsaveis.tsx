"use client";

import { Trophy } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { DashboardRankingResponsavel } from "@/domains/admin/dashboard/types/dashboard.responses";
import { formatDuration } from "@/lib/utils";


interface Props {
  ranking: DashboardRankingResponsavel[];
}

export function DashboardRankingResponsaveis({ ranking }: Props) {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Ranking de atendimento</CardTitle>
        <CardDescription>Quem mais encerrou chamados no período</CardDescription>
      </CardHeader>
      <CardContent>
        {ranking.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhum chamado encerrado no período selecionado.
          </p>
        ) : (
          <div className="flex flex-col">
            {ranking.map((item, index) => (
              <div key={item.responsavel_id}>
                <div className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                      {index === 0 ? <Trophy className="size-3.5 text-amber-500" /> : index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-none">{item.responsavel_nome}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Tempo médio: {formatDuration(item.tempo_medio_segundos)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums">{item.total_encerrados}</p>
                    <p className="text-xs text-muted-foreground">encerrados</p>
                  </div>
                </div>

                {index < ranking.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
