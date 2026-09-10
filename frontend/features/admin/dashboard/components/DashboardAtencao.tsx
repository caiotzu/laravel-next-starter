"use client";

import Link from "next/link";

import { AlertTriangle, ChevronRight, UserX } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";


import { getChamadoStatusBadge, getChamadoStatusIcon, getChamadoStatusLabel } from "@/constants/chamado-status";
import {
  DashboardChamadoResumo,
  DashboardChamadosSemResponsavel,
} from "@/domains/admin/dashboard/types/dashboard.responses";
import { formatDate } from "@/lib/utils";

interface Props {
  semResponsavel: DashboardChamadosSemResponsavel;
  maisAntigos: DashboardChamadoResumo[];
}

function ListaChamados({ chamados, vazio }: { chamados: DashboardChamadoResumo[]; vazio: string }) {
  if (chamados.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{vazio}</p>;
  }

  return (
    <div className="flex flex-col">
      {chamados.map((chamado) => {
        const StatusIcon = chamado.status ? getChamadoStatusIcon(chamado.status) : null;

        return (
          <Link
            key={chamado.id}
            href={`/admin/chamados/${chamado.id}`}
            className="flex items-center justify-between gap-3 border-b py-2.5 last:border-b-0 hover:bg-accent/40"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{chamado.assunto}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="font-mono">{chamado.ticket}</span>
                <span>• {chamado.cliente_nome ?? "—"}</span>
                <span>• desde {formatDate(chamado.aberto_em, false)}</span>
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {chamado.status && StatusIcon && (
                <Badge className={`gap-1 font-normal ${getChamadoStatusBadge(chamado.status)}`}>
                  <StatusIcon className="size-3" />
                  {getChamadoStatusLabel(chamado.status)}
                </Badge>
              )}
              <ChevronRight className="size-4 text-muted-foreground" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export function DashboardAtencao({ semResponsavel, maisAntigos }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2">
      <Card className="@container/card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserX className="size-6 text-amber-500 dark:text-amber-400" />
            Chamados sem responsável
          </CardTitle>
          <CardDescription>
            {semResponsavel.total} chamado{semResponsavel.total === 1 ? "" : "s"} em aberto sem ninguém atribuído
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ListaChamados
            chamados={semResponsavel.chamados}
            vazio="Todos os chamados em aberto têm um responsável."
          />
        </CardContent>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="size-6 text-amber-500 dark:text-amber-400" />
            Chamados mais antigos em aberto
          </CardTitle>
          <CardDescription>Independente do período selecionado</CardDescription>
        </CardHeader>
        <CardContent>
          <ListaChamados
            chamados={maisAntigos}
            vazio="Nenhum chamado em aberto no momento."
          />
        </CardContent>
      </Card>
    </div>
  );
}
