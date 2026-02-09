"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
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

import { excluirGrupoEmpresa } from "@/features/grupo-empresa/services/grupoEmpresaService";

import { GrupoEmpresa } from "../types/grupoEmpresa.model";

import { GrupoEmpresasTableSkeleton } from "./GrupoEmpresasTableSkeleton";

interface Props {
  data: GrupoEmpresa[];
  isLoading: boolean;
}

export function GrupoEmpresasTable({
  data,
  isLoading,
}: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutateAsync: deletar, isPending: isDeleting } = useMutation({
    mutationFn: excluirGrupoEmpresa,
    onSuccess: () => {
      toast.success("Grupo excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["grupo-empresas"] });
    },
    onError: () => {
      toast.error("Erro ao excluir grupo.");
    },
  });

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
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/admin/grupos-empresas/${grupo.id}`}
                        className="flex items-center gap-2 cursor-pointer w-full"
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </Link>
                    </DropdownMenuItem>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          onSelect={(e) => e.preventDefault()}
                          className="cursor-pointer flex items-center"
                        >
                          <Trash className="gap-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </AlertDialogTrigger>

                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Confirmar exclusão
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Essa ação não poderá ser desfeita!
                            <br />
                            Deseja realmente excluir o grupo ({grupo.nome}) ?
                          </AlertDialogDescription>
                        </AlertDialogHeader>

                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deletar(grupo.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Confirmar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

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
