"use client";

import { useState } from "react";

import Link from "next/link";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Pencil, Trash, Check } from "lucide-react";
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

import { excluirGrupoEmpresa, ativarGrupoEmpresa } from "@/features/admin/grupo-empresa/services/grupoEmpresaService";

import { GrupoEmpresa } from "../types/grupoEmpresa.model";

import { GrupoEmpresasTableSkeleton } from "./GrupoEmpresasTableSkeleton";

interface Props {
  data: GrupoEmpresa[];
  isLoading: boolean;
}

type ModalState = {
  tipo: "excluir" | "ativar" | null;
  grupoId: string | null;
};

export function GrupoEmpresasTable({ data, isLoading }: Props) {
  const queryClient = useQueryClient();

  // Estado único de modal
  const [modal, setModal] = useState<ModalState>({ tipo: null, grupoId: null });

  // Mutations
  const { mutateAsync: deletar } = useMutation({
    mutationFn: excluirGrupoEmpresa,
    onSuccess: () => {
      toast.success("Grupo excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["grupo-empresas"] });
      setModal({ tipo: null, grupoId: null });
    },
    onError: () => toast.error("Erro ao excluir o grupo."),
  });

  const { mutateAsync: ativar } = useMutation({
    mutationFn: ativarGrupoEmpresa,
    onSuccess: () => {
      toast.success("Grupo ativado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["grupo-empresas"] });
      setModal({ tipo: null, grupoId: null });
    },
    onError: () => toast.error("Erro ao ativar o grupo."),
  });

  if (isLoading) return <GrupoEmpresasTableSkeleton />;

  if (!data.length) {
    return (
      <div className="rounded-2xl border bg-background shadow-sm p-8 text-center text-muted-foreground">
        Nenhum registro encontrado
      </div>
    );
  }

  // Objeto do grupo que está no modal
  const grupoSelecionado = data.find((g) => g.id === modal.grupoId);

  return (
    <Card className="w-full rounded-2xl border shadow-sm p-0 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-primary hover:bg-primary shadow-inner border-b border-white/10">
            <TableHead className="text-primary-foreground tracking-wider font-semibold py-4">
              Nome
            </TableHead>
            <TableHead className="text-primary-foreground tracking-wider font-semibold py-4">
              Data Cadastro
            </TableHead>
            <TableHead className="text-primary-foreground tracking-wider font-semibold py-4">
              Status
            </TableHead>
            <TableHead className="text-primary-foreground tracking-wider font-semibold py-4 text-right">
              Ações
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.map((grupo) => (
            <TableRow
              key={grupo.id}
              className="border-b last:border-0 hover:bg-muted/40 even:bg-muted/20 transition-colors"
            >
              <TableCell className="font-medium">{grupo.nome}</TableCell>

              <TableCell className="text-sm text-muted-foreground">
                {new Date(grupo.created_at).toLocaleDateString("pt-BR")} •{" "}
                {new Date(grupo.created_at).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </TableCell>

              <TableCell>
                {grupo.deleted_at ? (
                  <Badge className="bg-red-100 text-red-700">Excluído</Badge>
                ) : (
                  <Badge className="bg-emerald-100 text-emerald-700">Ativo</Badge>
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
                    {/* Editar */}
                    {!grupo.deleted_at && (
                      <AdminPermissionGuard permission="admin.grupo_empresa.atualizar" disableFallback={true}>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/admin/grupos-empresas/${grupo.id}`}
                            className="flex items-center cursor-pointer"
                          >
                            <Pencil className="h-4 w-4"/>
                            Editar
                          </Link>
                        </DropdownMenuItem>
                      </AdminPermissionGuard>
                    )}

                    {/* Ativar */}
                    {grupo.deleted_at && (
                      <AdminPermissionGuard permission="admin.grupo_empresa.ativar" disableFallback={true}>
                        <DropdownMenuItem
                          onClick={() => setModal({ tipo: "ativar", grupoId: grupo.id })}
                          className="flex items-center cursor-pointer"
                        >
                          <Check className="h-4 w-4" />
                          Ativar
                        </DropdownMenuItem>
                      </AdminPermissionGuard>
                    )}

                    {/* Excluir */}
                    {!grupo.deleted_at && (
                      <AdminPermissionGuard permission="admin.grupo_empresa.excluir" disableFallback={true}>
                        <DropdownMenuItem
                          onClick={() => setModal({ tipo: "excluir", grupoId: grupo.id })}
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
      {grupoSelecionado && modal.tipo === "excluir" && (
        <AlertDialog open onOpenChange={() => setModal({ tipo: null, grupoId: null })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Deseja realmente excluir o grupo ({grupoSelecionado.nome})?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setModal({ tipo: null, grupoId: null })}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  await deletar(grupoSelecionado.id);
                  setModal({ tipo: null, grupoId: null });
                }}
                className="bg-red-700 hover:bg-red-800"
              >
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {grupoSelecionado && modal.tipo === "ativar" && (
        <AlertDialog open onOpenChange={() => setModal({ tipo: null, grupoId: null })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar ativação</AlertDialogTitle>
              <AlertDialogDescription>
                Deseja realmente ativar o grupo ({grupoSelecionado.nome})?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setModal({ tipo: null, grupoId: null })}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  await ativar(grupoSelecionado.id);
                  setModal({ tipo: null, grupoId: null });
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
