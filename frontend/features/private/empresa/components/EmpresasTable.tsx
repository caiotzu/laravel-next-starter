"use client";

import Link from "next/link";

import { MoreHorizontal, Pencil, Eye } from "lucide-react";

import { PrivatePermissionGuard } from "@/app/(private)/_components/guard/PrivatePermissionGuard";

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

import { Empresa } from "@/domains/private/empresa/types/empresa.model";
import { formatDate, maskCNPJAlfanumerico } from "@/lib/utils";

interface Props {
  data: Empresa[];
}

export function EmpresasTable({ data }: Props) {

  if (!data.length) {
    return (
      <Card className="rounded-2xl border shadow-sm p-8 text-center text-muted-foreground">
        Nenhum registro encontrado
      </Card>
    );
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "ativo":
        return <Badge className="bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400">Ativo</Badge>;
      case "pendente":
        return <Badge className="bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400">Pendente</Badge>;
      case "bloqueado":
        return <Badge className="bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400">Bloqueado</Badge>;
      default:
        return <Badge className="bg-slate-100 dark:bg-slate-950/30 text-slate-700 dark:text-slate-400">Inativo</Badge>;
    }
  }

  return (
    <Card className="overflow-hidden p-4">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>
              CNPJ
            </TableHead>
            <TableHead>
              Nome Fantasia
            </TableHead>
            <TableHead>
              Grupo
            </TableHead>
            <TableHead>
              Matriz
            </TableHead>
            <TableHead className="text-center">
              UF
            </TableHead>
            <TableHead className="text-center">
              Criado em
            </TableHead>
            <TableHead className="text-center">
              Status
            </TableHead>
            <TableHead className="text-right">
              Ações
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.map((empresa) => (
            <TableRow
              key={empresa.id}
              className="border-b last:border-0 hover:bg-muted/40 even:bg-muted/20 transition-colors"
            >
              <TableCell className="font-medium">{maskCNPJAlfanumerico(empresa.cnpj)}</TableCell>
              <TableCell className="font-medium">{empresa.nomeFantasia}</TableCell>
              <TableCell className="font-medium">{empresa?.grupoEmpresa?.nome}</TableCell>
              <TableCell className="font-medium">{empresa.matriz?.nomeFantasia || '---'}</TableCell>
              <TableCell className="font-medium text-center">{empresa.uf}</TableCell>
              <TableCell className="text-sm text-muted-foreground text-center">{formatDate(empresa.createdAt)}</TableCell>
              <TableCell className="text-center">
                {empresa.deletedAt ? (
                  <Badge className="bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400">Excluído</Badge>
                ) : (
                  getStatusBadge(empresa.status)
                )}
              </TableCell>

              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end">
                    {/* Visualizar */}
                    <PrivatePermissionGuard permission="private.empresa.visualizar" disableFallback={true}>
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/empresas/${empresa.id}/visualizar`}
                          className="flex items-center cursor-pointer"
                        >
                          <Eye className="h-4 w-4"/>
                          Visualizar
                        </Link>
                      </DropdownMenuItem>
                    </PrivatePermissionGuard>

                    {/* Editar */}
                    {!empresa.deletedAt && (
                      <PrivatePermissionGuard permission="private.empresa.atualizar" disableFallback={true}>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/empresas/${empresa.id}`}
                            className="flex items-center cursor-pointer"
                          >
                            <Pencil className="h-4 w-4"/>
                            Editar
                          </Link>
                        </DropdownMenuItem>
                      </PrivatePermissionGuard>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
