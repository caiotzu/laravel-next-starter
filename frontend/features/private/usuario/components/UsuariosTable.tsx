"use client";

import { useState } from "react";

import Link from "next/link";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Pencil, Trash, Check, Eye } from "lucide-react";
import { toast } from "sonner";

import { PrivatePermissionGuard } from "@/app/(private)/_components/guard/PrivatePermissionGuard";

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

import { getUsuarioStatusClassText, getUsuarioStatusLabel } from "@/constants/usuario-status";
import { ativarUsuario, excluirUsuario } from "@/domains/private/usuario/services/usuarioService";
import { Usuario } from "@/domains/private/usuario/types/usuario.model";
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
    <Card className="overflow-hidden p-4">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>
              Nome
            </TableHead>
            <TableHead>
							E-mail
            </TableHead>
            <TableHead className="text-center">
              Status
            </TableHead>
						<TableHead>
              Grupo
            </TableHead>
						<TableHead className="text-center">
              Criado em
            </TableHead>
            <TableHead className="text-right">
              Ações
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody className="text-sm text-muted-foreground">
          {data.map((usuario) => (
            <TableRow
              key={usuario.id}
              className="border-b last:border-0 hover:bg-muted/40 even:bg-muted/20 transition-colors"
            >
              <TableCell>
                <div className="flex flex-col">
                  <span>{usuario.nome}</span>
                  <span className={`text-xs ${getUsuarioStatusClassText( usuario.status )}`}>
                    {getUsuarioStatusLabel( usuario.status )}
                  </span>
                </div>
              </TableCell>
              <TableCell className="font-medium">{usuario.email}</TableCell>
              <TableCell className="text-center">
                {usuario.deletedAt ? (
                  <Badge className="bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400">Excluído</Badge>
                ) : (
                  <Badge className="bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400">Ativo</Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span>{usuario.grupo?.descricao}</span>

                  {usuario.grupo?.deletedAt && (
                    <span className="text-xs text-muted-foreground">
                      Grupo excluído
                    </span>
                  )}
                </div>
              </TableCell>
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
                    <PrivatePermissionGuard permission="private.usuario.visualizar" disableFallback={true}>
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/usuarios/${usuario.id}/visualizar`}
                          className="flex items-center cursor-pointer"
                        >
                          <Eye className="h-4 w-4"/>
                          Visualizar
                        </Link>
                      </DropdownMenuItem>
                    </PrivatePermissionGuard>

                    {/* Editar */}
                    {!usuario.deletedAt && (
                      <PrivatePermissionGuard permission="private.usuario.atualizar" disableFallback={true}>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/usuarios/${usuario.id}`}
                            className="flex items-center cursor-pointer"
                          >
                            <Pencil className="h-4 w-4"/>
                            Editar
                          </Link>
                        </DropdownMenuItem>
                      </PrivatePermissionGuard>
                    )}

                    {/* Ativar */}
                    {usuario.deletedAt && (
                      <PrivatePermissionGuard permission="private.usuario.ativar" disableFallback={true}>
                        <DropdownMenuItem
                          onClick={() => setModal({ tipo: "ativar", usuarioId: usuario.id })}
                          className="flex items-center cursor-pointer"
                        >
                          <Check className="h-4 w-4" />
                          Ativar
                        </DropdownMenuItem>
                      </PrivatePermissionGuard>
                    )}

                    {/* Excluir */}
                    {!usuario.deletedAt && (
                      <PrivatePermissionGuard permission="private.usuario.excluir" disableFallback={true}>
                        <DropdownMenuItem
                          onClick={() => setModal({ tipo: "excluir", usuarioId: usuario.id })}
                          className="flex items-center cursor-pointer"
                        >
                          <Trash className="h-4 w-4" />
                          Excluir
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