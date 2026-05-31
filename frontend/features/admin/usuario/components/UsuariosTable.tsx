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

import { getUsuarioStatusClassName, getUsuarioStatusLabel } from "@/constants/usuario-status";
import { ativarUsuario, excluirUsuario } from "@/domains/admin/usuario/services/usuarioService";
import { Usuario } from "@/domains/admin/usuario/types/usuario.model";
import { formatDate } from "@/lib/utils";

interface Props {
	data: Usuario[];
}

type ModalState = {
  tipo: "excluir" | "ativar" | null;
  usuarioId: string | null;
};

export function UsuariosTable({ data }: Props) {
  const queryClient = useQueryClient();
	const [modal, setModal] = useState<ModalState>({ tipo: null, usuarioId: null });

	const { mutateAsync: deletar } = useMutation({
    mutationFn: excluirUsuario,
    onSuccess: () => {
      toast.success("Usuário excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      setModal({ tipo: null, usuarioId: null });
    },
    onError: () => toast.error("Erro ao excluir o usuário."),
  });

	const { mutateAsync: ativar } = useMutation({
		mutationFn: ativarUsuario,
		onSuccess: () => {
			toast.success("Usuário ativado com sucesso");
			queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      setModal({ tipo: null, usuarioId: null });
		},
		onError: () => toast.error("Erro ao ativar o usuário")
	});

	const usuarioSelecionado = data.find((u) => u.id === modal.usuarioId);
	
	return (
    <Card className="w-full rounded-2xl border shadow-sm p-0 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-primary hover:bg-primary shadow-inner border-b border-white/10">
            <TableHead className="text-primary-foreground tracking-wider font-semibold py-4">
              Nome
            </TableHead>
            <TableHead className="text-primary-foreground tracking-wider font-semibold py-4">
							E-mail
            </TableHead>
            <TableHead className="text-primary-foreground tracking-wider font-semibold py-4 text-center">
              Status
            </TableHead>
             <TableHead className="text-primary-foreground tracking-wider font-semibold py-4 text-center">
              Registro
            </TableHead>
						<TableHead className="text-primary-foreground tracking-wider font-semibold py-4">
              Grupo
            </TableHead>
						<TableHead className="text-primary-foreground tracking-wider font-semibold py-4 text-center">
              Criado em
            </TableHead>
            <TableHead className="text-primary-foreground tracking-wider font-semibold py-4 text-right">
              Ações
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.map((usuario) => (
            <TableRow
              key={usuario.id}
              className="border-b last:border-0 hover:bg-muted/40 even:bg-muted/20 transition-colors"
            >
              <TableCell className="font-medium">{usuario.nome}</TableCell>
              <TableCell className="font-medium">{usuario.email}</TableCell>
							<TableCell className="text-center">
								<Badge className={getUsuarioStatusClassName( usuario.status )}>
									{getUsuarioStatusLabel( usuario.status )}
								</Badge>
							</TableCell>
              <TableCell className="text-center">
                {usuario.deletedAt ? (
                  <Badge className="bg-red-100 text-red-700">Excluído</Badge>
                ) : (
                  <Badge className="bg-emerald-100 text-emerald-700">Ativo</Badge>
                )}
              </TableCell>
              <TableCell className="font-medium">{usuario.grupo?.descricao}</TableCell>
              <TableCell className="text-sm text-muted-foreground text-center">
                {formatDate(usuario.createdAt)}
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
                    <AdminPermissionGuard permission="admin.usuario.visualizar" disableFallback={true}>
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/admin/usuarios/${usuario.id}/visualizar`}
                          className="flex items-center cursor-pointer"
                        >
                          <Eye className="h-4 w-4"/>
                          Visualizar
                        </Link>
                      </DropdownMenuItem>
                    </AdminPermissionGuard>

                    {/* Editar */}
                    {!usuario.deletedAt && (
                      <AdminPermissionGuard permission="admin.usuario.atualizar" disableFallback={true}>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/admin/usuarios/${usuario.id}`}
                            className="flex items-center cursor-pointer"
                          >
                            <Pencil className="h-4 w-4"/>
                            Editar
                          </Link>
                        </DropdownMenuItem>
                      </AdminPermissionGuard>
                    )}

                    {/* Ativar */}
                    {usuario.deletedAt && (
                      <AdminPermissionGuard permission="admin.usuario.ativar" disableFallback={true}>
                        <DropdownMenuItem
                          onClick={() => setModal({ tipo: "ativar", usuarioId: usuario.id })}
                          className="flex items-center cursor-pointer"
                        >
                          <Check className="h-4 w-4" />
                          Ativar
                        </DropdownMenuItem>
                      </AdminPermissionGuard>
                    )}

                    {/* Excluir */}
                    {!usuario.deletedAt && (
                      <AdminPermissionGuard permission="admin.usuario.excluir" disableFallback={true}>
                        <DropdownMenuItem
                          onClick={() => setModal({ tipo: "excluir", usuarioId: usuario.id })}
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

      {usuarioSelecionado && modal.tipo === "excluir" && (
        <AlertDialog open onOpenChange={() => setModal({ tipo: null, usuarioId: null })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Deseja realmente excluir o usuário ({usuarioSelecionado.nome})?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setModal({ tipo: null, usuarioId: null })}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  await deletar(usuarioSelecionado.id);
                  setModal({ tipo: null, usuarioId: null });
                }}
                className="bg-red-700 hover:bg-red-800"
              >
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {usuarioSelecionado && modal.tipo === "ativar" && (
        <AlertDialog open onOpenChange={() => setModal({ tipo: null, usuarioId: null })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar ativação</AlertDialogTitle>
              <AlertDialogDescription>
                Deseja realmente ativar o usuário ({usuarioSelecionado.nome})?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setModal({ tipo: null, usuarioId: null })}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  await ativar(usuarioSelecionado.id);
                  setModal({ tipo: null, usuarioId: null });
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