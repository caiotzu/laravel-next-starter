"use client";

import { useState } from "react";

import Link from "next/link";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Pencil, Trash, Check, Eye } from "lucide-react";
import { toast } from "sonner";

import { AdminPermissionGuard } from "@/app/admin/_components/guard/AdminPermissionGuard";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

import { ativarEmpresa, excluirEmpresa } from "@/domains/admin/empresa/services/empresaService";
import { Empresa } from "@/domains/admin/empresa/types/empresa.model";
import { formatDate, maskCNPJAlfanumerico } from "@/lib/utils";

interface Props {
  data: Empresa[];
}

type ModalState = {
  tipo: "excluir" | "ativar" | null;
  empresaId: string | null;
};

export function EmpresasTable({ data }: Props) {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<ModalState>({ tipo: null, empresaId: null });

  const { mutateAsync: deletar } = useMutation({
    mutationFn: excluirEmpresa,
    onSuccess: () => {
      toast.success("Empresa excluída com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["empresas"] });
      setModal({ tipo: null, empresaId: null });
    },
    onError: () => toast.error("Erro ao excluir a empresa."),
  });

  const { mutateAsync: ativar } = useMutation({
    mutationFn: ativarEmpresa,
    onSuccess: () => {
      toast.success("Empresa ativada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["empresas"] });
      setModal({ tipo: null, empresaId: null });
    },
    onError: () => toast.error("Erro ao ativar a empresa."),
  });

  if (!data.length) {
    return (
      <Card className="rounded-2xl border shadow-sm p-8 text-center text-muted-foreground">
        Nenhum registro encontrado
      </Card>
    );
  }

  const empresaSelecionada = data.find((g) => g.id === modal.empresaId);

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

        <TableBody className="text-sm text-muted-foreground">
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
                    <AdminPermissionGuard permission="admin.empresa.visualizar" disableFallback={true}>
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/admin/empresas/${empresa.id}/visualizar`}
                          className="flex items-center cursor-pointer"
                        >
                          <Eye className="h-4 w-4"/>
                          Visualizar
                        </Link>
                      </DropdownMenuItem>
                    </AdminPermissionGuard>

                    {/* Editar */}
                    {!empresa.deletedAt && (
                      <AdminPermissionGuard permission="admin.empresa.atualizar" disableFallback={true}>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/admin/empresas/${empresa.id}`}
                            className="flex items-center cursor-pointer"
                          >
                            <Pencil className="h-4 w-4"/>
                            Editar
                          </Link>
                        </DropdownMenuItem>
                      </AdminPermissionGuard>
                    )}

                    {/* Ativar */}
                    {empresa.deletedAt && (
                      <AdminPermissionGuard permission="admin.empresa.ativar" disableFallback={true}>
                        <DropdownMenuItem
                          onClick={() => setModal({ tipo: "ativar", empresaId: empresa.id })}
                          className="flex items-center cursor-pointer"
                        >
                          <Check className="h-4 w-4" />
                          Ativar
                        </DropdownMenuItem>
                      </AdminPermissionGuard>
                    )}

                    {/* Excluir */}
                    {!empresa.deletedAt && (
                      <AdminPermissionGuard permission="admin.empresa.excluir" disableFallback={true}>
                        <DropdownMenuItem
                          onClick={() => setModal({ tipo: "excluir", empresaId: empresa.id })}
                          className="flex items-center cursor-pointer"
                        >
                          <Trash className="h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </AdminPermissionGuard>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* ----------------- Modais compartilhados ----------------- */}
      {empresaSelecionada && modal.tipo === "excluir" && (
        <AlertDialog open onOpenChange={() => setModal({ tipo: null, empresaId: null })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Deseja realmente excluir a empresa ({empresaSelecionada.nomeFantasia})?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setModal({ tipo: null, empresaId: null })}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  await deletar(empresaSelecionada.id);
                  setModal({ tipo: null, empresaId: null });
                }}
                className="bg-red-700 hover:bg-red-800"
              >
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {empresaSelecionada && modal.tipo === "ativar" && (
        <AlertDialog open onOpenChange={() => setModal({ tipo: null, empresaId: null })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar ativação</AlertDialogTitle>
              <AlertDialogDescription>
                Deseja realmente ativar a empresa ({empresaSelecionada.nomeFantasia})?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setModal({ tipo: null, empresaId: null })}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  await ativar(empresaSelecionada.id);
                  setModal({ tipo: null, empresaId: null });
                }}
              >
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Card>
  );
}
