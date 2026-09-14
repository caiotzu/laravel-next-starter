"use client";

import { useState } from "react";

import Link from "next/link";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, Monitor, MoreHorizontal, Pencil, Power, PowerOff, Trash2 } from "lucide-react";
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


import {
  ativarBanner,
  desativarBanner,
  excluirBanner,
} from "@/domains/admin/banner/services/bannerService";
import { Banner } from "@/domains/admin/banner/types/banner.model";
import { formatDate } from "@/lib/utils";

import { bannerPreviewDoBannerSalvo } from "../utils/bannerPreview";

import { BannerPreviewModal } from "./BannerPreviewModal";

interface Props {
  data: Banner[];
}

export function BannersTable({ data: banners }: Props) {
  const queryClient = useQueryClient();

  // Ver item 4 do pedido: Preview a partir dos dados já salvos deste
  // banner — mesmo componente compartilhado usado no cadastro/edição
  // (ver BannerForm.tsx).
  const [bannerEmPreview, setBannerEmPreview] = useState<Banner | null>(null);

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

  if (banners.length === 0) {
    return (
      <Card className="rounded-2xl border shadow-sm p-8 text-center text-muted-foreground">
        Nenhum banner encontrado
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-4">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Título</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Direcionamento</TableHead>
            <TableHead>Início</TableHead>
            <TableHead>Término</TableHead>
            <TableHead>Imagens</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody className="text-sm text-muted-foreground">
          {banners.map((banner) => (
                <TableRow
                  key={banner.id}
                  className="border-b last:border-0 hover:bg-muted/40 even:bg-muted/20 transition-colors"
                >
                  <TableCell className="font-medium text-foreground">{banner.titulo}</TableCell>
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

                          <DropdownMenuItem onClick={() => setBannerEmPreview(banner)}>
                            <Monitor className="mr-2 h-4 w-4" />
                            Preview
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

      <BannerPreviewModal
        banner={bannerEmPreview ? bannerPreviewDoBannerSalvo(bannerEmPreview) : null}
        open={bannerEmPreview !== null}
        onClose={() => setBannerEmPreview(null)}
      />
    </Card>
  );
}
