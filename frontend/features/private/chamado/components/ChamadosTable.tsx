"use client";

import Link from "next/link";

import { MoreHorizontal, Eye } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  getChamadoStatusBadge,
  getChamadoStatusIcon,
  getChamadoStatusLabel,
} from "@/constants/chamado-status";
import { getChamadoTipoLabel } from "@/constants/chamado-tipo";
import { Chamado } from "@/domains/private/chamado/types/chamado.model";
import { formatDate } from "@/lib/utils";

interface Props {
  chamados: Chamado[];
  hrefBase: string;
}

export function ChamadosTable({ chamados, hrefBase }: Props) {
  if (!chamados.length) {
    return (
      <Card className="rounded-2xl border shadow-sm p-8 text-center text-muted-foreground">
        Você ainda não abriu nenhum chamado.
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-4">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Ticket</TableHead>
              <TableHead>Assunto</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aberto em</TableHead>
              <TableHead>Última interação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="text-sm text-muted-foreground">
            {chamados.map((chamado) => {
              const Icon = getChamadoStatusIcon(chamado.status);
              const href = `${hrefBase}/${chamado.id}`;

              return (
                <TableRow
                  key={chamado.id}
                  className="border-b last:border-0 hover:bg-muted/40 even:bg-muted/20 transition-colors"
                >
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    <Link
                      href={href}
                      className="hover:text-primary hover:underline"
                    >
                      {chamado.ticket}
                    </Link>
                  </TableCell>

                  <TableCell className="max-w-[280px]">
                    <span
                      className="block truncate text-muted-foreground"
                      title={chamado.assunto}
                    >
                      {chamado.assunto}
                    </span>
                  </TableCell>

                  <TableCell>
                    {getChamadoTipoLabel(chamado.tipo)}
                  </TableCell>

                  <TableCell>
                    <Badge
                      className={`gap-1.5 font-normal ${getChamadoStatusBadge(
                        chamado.status
                      )}`}
                    >
                      <Icon className="size-3.5" />
                      {getChamadoStatusLabel(chamado.status)}
                    </Badge>
                  </TableCell>

                  <TableCell className="whitespace-nowrap">
                    {formatDate(chamado.abertoEm, false)}
                  </TableCell>

                  <TableCell className="whitespace-nowrap">
                    {formatDate(chamado.ultimaInteracaoEm)}
                  </TableCell>

                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Ações do chamado ${chamado.ticket}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link
                            href={href}
                            className="flex items-center cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                            Visualizar
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
