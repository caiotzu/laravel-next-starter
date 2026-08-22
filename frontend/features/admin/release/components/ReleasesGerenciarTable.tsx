"use client";

import { Loader2, Pencil, Send } from "lucide-react";

import { AdminPermissionGuard } from "@/app/admin/_components/guard/AdminPermissionGuard";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Release } from "@/domains/admin/release/types/release.model";

function formatarData(data: string | null): string {
  if (!data) return "—";
  return new Date(data).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

interface Props {
  releases: Release[];
  onEditar: (release: Release) => void;
  onPublicar: (release: Release) => void;
  publicandoId?: string | null;
}

export function ReleasesGerenciarTable({ releases, onEditar, onPublicar, publicandoId }: Props) {
  if (releases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center">
        <p className="text-sm text-muted-foreground">Nenhuma release encontrada.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
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
          {releases.map((release) => (
            <TableRow key={release.id}>
              <TableCell className="max-w-[280px] truncate font-medium">{release.titulo}</TableCell>
              <TableCell className="capitalize">{release.contexto ?? "—"}</TableCell>
              <TableCell>{release.tipoLabel}</TableCell>
              <TableCell>v{release.versao}</TableCell>
              <TableCell>
                <Badge variant={release.status === "published" ? "default" : "secondary"}>
                  {release.status === "published" ? "Publicada" : "Rascunho"}
                </Badge>
              </TableCell>
              <TableCell>{formatarData(release.publicadoEm)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <AdminPermissionGuard permission="admin.release.editar">
                    <Button variant="ghost" size="icon" onClick={() => onEditar(release)}>
                      <Pencil className="size-4" />
                    </Button>
                  </AdminPermissionGuard>

                  {release.status === "draft" && (
                    <AdminPermissionGuard permission="admin.release.publicar">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={publicandoId === release.id}
                        onClick={() => onPublicar(release)}
                      >
                        {publicandoId === release.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Send className="size-4" />
                        )}
                      </Button>
                    </AdminPermissionGuard>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
