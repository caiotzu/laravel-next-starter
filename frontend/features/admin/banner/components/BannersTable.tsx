"use client";

import Link from "next/link";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, MoreHorizontal, Pencil, Power, PowerOff, Trash2 } from "lucide-react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
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


import {
  ativarBanner,
  desativarBanner,
  excluirBanner,
} from "@/domains/admin/banner/services/bannerService";
import { Banner } from "@/domains/admin/banner/types/banner.model";
import { formatDate } from "@/lib/utils";

interface Props {
  data: Banner[];
}

export function BannersTable({ data: banners }: Props) {
  const queryClient = useQueryClient();

  const { mutateAsync: mutarStatus } = useMutation({
    mutationFn: ({ id, ativar }: { id: string; ativar: boolean }) =>
      ativar ? ativarBanner(id) : desativarBanner(id),
    onSuccess: (_, { ativar }) => {
      toast.success(ativar ? "Banner ativado com sucesso." : "Banner desativado com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["banners"] });
    },
    onError: () => {
      toast.error("Não foi possível atualizar o status do banner.");
    },
  });

  const { mutateAsync: excluir } = useMutation({
    mutationFn: excluirBanner,
    onSuccess: () => {
      toast.success("Banner excluído com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["banners"] });
    },
    onError: () => {
      toast.error("Não foi possível excluir o banner.");
    },
  });

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Direcionamento</TableHead>
              <TableHead>Início</TableHead>
              <TableHead>Término</TableHead>
              <TableHead>Imagens</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {banners.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhum banner encontrado.
                </TableCell>
              </TableRow>
            )}

            {banners.map((banner) => (
                <TableRow key={banner.id}>
                  <TableCell className="font-medium">{banner.titulo}</TableCell>
                  <TableCell>
                    <Badge variant={banner.status === "ativo" ? "default" : "secondary"}>
                      {banner.statusLabel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {banner.direcionamento.tipoLabel}
                    {banner.direcionamento.entidadeTipo && ` (${banner.direcionamento.entidadeTipo})`}
                  </TableCell>
                  <TableCell>{formatDate(banner.inicioEm)}</TableCell>
                  <TableCell>{banner.fimEm ? formatDate(banner.fimEm) : "—"}</TableCell>
                  <TableCell>{banner.totalImagens ?? banner.imagens.length}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <AdminPermissionGuard permission="admin.banner.visualizar" disableFallback>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/banners/${banner.id}/visualizar`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Visualizar
                            </Link>
                          </DropdownMenuItem>
                        </AdminPermissionGuard>

                        <AdminPermissionGuard permission="admin.banner.atualizar" disableFallback>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/banners/${banner.id}`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </Link>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() =>
                              mutarStatus({ id: banner.id, ativar: banner.status !== "ativo" })
                            }
                          >
                            {banner.status === "ativo" ? (
                              <>
                                <PowerOff className="mr-2 h-4 w-4" />
                                Desativar
                              </>
                            ) : (
                              <>
                                <Power className="mr-2 h-4 w-4" />
                                Ativar
                              </>
                            )}
                          </DropdownMenuItem>
                        </AdminPermissionGuard>

                        <AdminPermissionGuard permission="admin.banner.excluir" disableFallback>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir banner</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o banner &quot;{banner.titulo}
                                  &quot;? Essa ação não poderá ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => excluir(banner.id)}>
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </AdminPermissionGuard>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
