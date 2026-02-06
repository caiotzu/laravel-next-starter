"use client";

import { GrupoEmpresa } from "../types";
import { GrupoEmpresasTableSkeleton } from "./GrupoEmpresasTableSkeleton";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";

interface Props {
  data: GrupoEmpresa[];
  isLoading: boolean;
}

export default function GrupoEmpresasTable({
  data,
  isLoading,
}: Props) {
  if (isLoading) return <GrupoEmpresasTableSkeleton />;

  if (!data.length) {
    return (
      <div className="rounded-2xl border bg-background shadow-sm p-8 text-center text-muted-foreground">
        Nenhum registro encontrado
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-background shadow-sm">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Data Cadastro</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.map((grupo) => (
            <TableRow key={grupo.id}>
              <TableCell className="font-medium">
                {grupo.nome}
              </TableCell>

              <TableCell>
                {new Date(grupo.created_at).toLocaleDateString()}
              </TableCell>

              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>

                    <DropdownMenuItem className="text-red-500 focus:text-red-500">
                      <Trash className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
