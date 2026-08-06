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
        return <Badge className="bg-emerald-100 text-emerald-700">Ativo</Badge>;
      case "pendente":
        return <Badge className="bg-amber-100 text-amber-700">Pendente</Badge>;
      case "bloqueado":
        return <Badge className="bg-red-100 text-red-700">Bloqueado</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-700">Inativo</Badge>;
    }
  }

  return (
    <Card className="w-full rounded-2xl border shadow-sm p-0 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-primary hover:bg-primary shadow-inner border-b border-white/10">
            <TableHead className="text-primary-foreground tracking-wider font-semibold py-4">
              CNPJ
            </TableHead>
            <TableHead className="text-primary-foreground tracking-wider font-semibold py-4">
              Nome Fantasia
            </TableHead>
            <TableHead className="text-primary-foreground tracking-wider font-semibold py-4">
              Grupo
            </TableHead>
            <TableHead className="text-primary-foreground tracking-wider font-semibold py-4">
              Matriz
            </TableHead>
            <TableHead className="text-primary-foreground tracking-wider font-semibold py-4 text-center">
              UF
            </TableHead>
            <TableHead className="text-primary-foreground tracking-wider font-semibold py-4 text-center">
              Criado em
            </TableHead>
            <TableHead className="text-primary-foreground tracking-wider font-semibold py-4 text-center">
              Status
            </TableHead>
            <TableHead className="text-primary-foreground tracking-wider font-semibold py-4 text-right">
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
                  <Badge className="bg-red-100 text-red-700">Excluído</Badge>
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
