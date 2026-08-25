"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


import { getChamadoPrioridadeBadge, getChamadoPrioridadeLabel } from "@/constants/chamado-prioridade";
import { getChamadoStatusBadge, getChamadoStatusIcon, getChamadoStatusLabel } from "@/constants/chamado-status";
import { getChamadoTipoLabel } from "@/constants/chamado-tipo";
import { Chamado } from "@/domains/admin/chamado/types/chamado.model";
import { formatDate } from "@/lib/utils";

interface Props {
  chamados: Chamado[];
  hrefBase: string;
}

export function ChamadosTable({ chamados, hrefBase }: Props) {
  if (chamados.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center gap-2 border-dashed py-16 text-center shadow-none">
        <p className="text-sm text-muted-foreground">Nenhum chamado encontrado.</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0 shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ticket</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Assunto</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Prioridade</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Última interação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {chamados.map((chamado) => {
            const Icon = getChamadoStatusIcon(chamado.status);

            return (
              <TableRow key={chamado.id}>
                <TableCell className="font-mono text-xs">
                  <Link href={`${hrefBase}/${chamado.id}`} className="hover:underline">
                    {chamado.ticket}
                  </Link>
                </TableCell>
                <TableCell className="max-w-[180px] truncate text-sm">
                  {chamado.cliente.nome ?? "—"}
                </TableCell>
                <TableCell className="max-w-[240px] truncate">
                  <Link href={`${hrefBase}/${chamado.id}`} className="hover:underline">
                    {chamado.assunto}
                  </Link>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {getChamadoTipoLabel(chamado.tipo)}
                </TableCell>
                <TableCell>
                  <Badge className={`gap-1.5 font-normal ${getChamadoStatusBadge(chamado.status)}`}>
                    <Icon className="size-3.5" />
                    {getChamadoStatusLabel(chamado.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={`font-normal ${getChamadoPrioridadeBadge(chamado.prioridade)}`}>
                    {getChamadoPrioridadeLabel(chamado.prioridade)}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {chamado.responsavel?.nome ?? "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(chamado.ultimaInteracaoEm)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
