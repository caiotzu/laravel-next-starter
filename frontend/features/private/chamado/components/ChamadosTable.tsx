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


import { getChamadoStatusBadge, getChamadoStatusIcon, getChamadoStatusLabel } from "@/constants/chamado-status";
import { getChamadoTipoLabel } from "@/constants/chamado-tipo";
import { Chamado } from "@/domains/private/chamado/types/chamado.model";
import { formatDate } from "@/lib/utils";

interface Props {
  chamados: Chamado[];
  hrefBase: string;
}

export function ChamadosTable({ chamados, hrefBase }: Props) {
  if (chamados.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center gap-2 border-dashed py-16 text-center shadow-none">
        <p className="text-sm text-muted-foreground">
          Você ainda não abriu nenhum chamado.
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0 shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ticket</TableHead>
            <TableHead>Assunto</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Aberto em</TableHead>
            <TableHead>Última interação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {chamados.map((chamado) => {
            const Icon = getChamadoStatusIcon(chamado.status);

            return (
              <TableRow key={chamado.id} className="cursor-pointer">
                <TableCell className="font-mono text-xs">
                  <Link href={`${hrefBase}/${chamado.id}`} className="hover:underline">
                    {chamado.ticket}
                  </Link>
                </TableCell>
                <TableCell className="max-w-[280px] truncate">
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
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(chamado.abertoEm, false)}
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
