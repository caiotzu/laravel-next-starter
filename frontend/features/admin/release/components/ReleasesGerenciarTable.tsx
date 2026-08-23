"use client";

import Link from "next/link";

import {
  Eye,
  Loader2,
  MoreHorizontal,
  Pencil,
  Send,
} from "lucide-react";

import { AdminPermissionGuard } from "@/app/admin/_components/guard/AdminPermissionGuard";

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
  getReleaseTipoBadge,
  getReleaseTipoIcon,
  getReleaseTipoLabel,
} from "@/constants/release-tipo";
import { Release } from "@/domains/admin/release/types/release.model";
import { formatDate } from "@/lib/utils";

interface Props {
  releases: Release[];
  onPublicar: (release: Release) => void;
  publicandoId?: string | null;
}

/**
 * Cadastro/edição agora são páginas próprias (ver app/admin/releases/
 * gerenciar/cadastrar e /[id]/editar) — a coluna de ações só navega para
 * elas, sem callback de abrir modal.
 */
export function ReleasesGerenciarTable({
  releases,
  onPublicar,
  publicandoId,
}: Props) {
  if (releases.length === 0) {
    return (
      <Card className="overflow-hidden p-0">
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhuma release encontrada.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Título</TableHead>
            <TableHead>Contexto</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Versão</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Publicada em</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {releases.map((release) => {
            const Icon = getReleaseTipoIcon(release.tipo);

            return (
              <TableRow key={release.id}>
                <TableCell className="max-w-[280px] truncate font-medium">
                  {release.titulo}
                </TableCell>

                <TableCell className="capitalize">
                  {release.contexto ?? "—"}
                </TableCell>

                <TableCell>
                  <Badge
                    className={`gap-1.5 font-normal ${getReleaseTipoBadge(
                      release.tipo
                    )}`}
                  >
                    <Icon className="size-3.5" strokeWidth={2.5} />
                    {getReleaseTipoLabel(release.tipo)}
                  </Badge>
                </TableCell>

                <TableCell>
                  <Badge variant="outline">v{release.versao}</Badge>
                </TableCell>

                <TableCell>
                  <Badge
                    variant={
                      release.status === "published"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {release.status === "published"
                      ? "Publicada"
                      : "Rascunho"}
                  </Badge>
                </TableCell>

                <TableCell>
                  {formatDate(release.publicadoEm, false)}
                </TableCell>

                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Ações</span>
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      {/* Visualizar */}
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/admin/releases/${release.id}`}
                          className="flex cursor-pointer items-center"
                        >
                          <Eye className="h-4 w-4" />
                          Visualizar
                        </Link>
                      </DropdownMenuItem>

                      {/* Editar */}
                      <AdminPermissionGuard permission="admin.release.editar">
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/admin/releases/gerenciar/${release.id}/editar`}
                            className="flex cursor-pointer items-center"
                          >
                            <Pencil className="h-4 w-4" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                      </AdminPermissionGuard>

                      {/* Publicar */}
                      {release.status === "draft" && (
                        <AdminPermissionGuard permission="admin.release.publicar">
                          <DropdownMenuItem
                            disabled={publicandoId === release.id}
                            onClick={() => onPublicar(release)}
                            className="cursor-pointer"
                          >
                            {publicandoId === release.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}

                            Publicar
                          </DropdownMenuItem>
                        </AdminPermissionGuard>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}