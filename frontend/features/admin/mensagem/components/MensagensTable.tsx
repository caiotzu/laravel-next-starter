"use client";

import Link from "next/link";

import { Eye } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Mensagem } from "@/domains/admin/mensagem/types/mensagem.model";
import { formatDate } from "@/lib/utils";

interface Props {
  data: Mensagem[];
}

function direcionamentoLabel(mensagem: Mensagem): string {
  if (!mensagem.direcionamento) return "---";

  const direcionamento = mensagem.direcionamento;

  if (direcionamento.tipo === "geral") {
    return "Geral";
  }

  if (direcionamento.tipo === "entidade") {
    return direcionamento.entidadeTipo === "admin"
      ? "Entidade: Admin"
      : direcionamento.entidadeTipo === "private"
        ? "Entidade: Private"
        : "Entidade";
  }

  if (direcionamento.tipo === "grupo_empresa") {
    return direcionamento.grupoEmpresaNome
      ? `Grupo: ${direcionamento.grupoEmpresaNome}`
      : "Grupo de empresa";
  }

  return direcionamento.usuarioNome
    ? `Usuário: ${direcionamento.usuarioNome}`
    : "Usuário";
}

export function MensagensTable({ data }: Props) {
  if (!data.length) {
    return (
      <Card className="rounded-2xl border shadow-sm p-8 text-center text-muted-foreground">
        Nenhum registro encontrado
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-4">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Título</TableHead>
            <TableHead>Direcionamento</TableHead>
            <TableHead className="text-center">Origem</TableHead>
            <TableHead className="text-center">Lidas</TableHead>
            <TableHead className="text-center">Enviado em</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody className="text-sm text-muted-foreground">
          {data.map((mensagem) => (
            <TableRow
              key={mensagem.id}
              className="border-b last:border-0 hover:bg-muted/40 even:bg-muted/20 transition-colors"
            >
              <TableCell className="font-medium text-foreground">
                {mensagem.titulo}
              </TableCell>

              <TableCell>{direcionamentoLabel(mensagem)}</TableCell>

              <TableCell className="text-center">
                {mensagem.origem === "sistema" ? (
                  <Badge variant="secondary">Sistema</Badge>
                ) : (
                  <Badge className="bg-indigo-100 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400">
                    Administrador
                  </Badge>
                )}
              </TableCell>

              <TableCell className="text-center">
                {mensagem.totalLidos}/{mensagem.totalDestinatarios}
              </TableCell>

              <TableCell className="text-center">
                {formatDate(mensagem.createdAt)}
              </TableCell>

              <TableCell className="text-right">
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/admin/mensagens/${mensagem.id}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
