"use client";

import { useState } from "react";

import { Loader2, ShieldOff } from "lucide-react";

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


import { useRevogarAcessoSuporte } from "@/domains/private/acesso-suporte/hooks/useRevogarAcessoSuporte";
import { AcessoSuporte } from "@/domains/private/acesso-suporte/types/acessoSuporte.model";
import { formatDate } from "@/lib/utils";

export function AcessosSuporteTable({ data }: { data: AcessoSuporte[] }) {
  const [paraRevogar, setParaRevogar] = useState<AcessoSuporte | null>(null);
  const { mutate: revogar, isPending } = useRevogarAcessoSuporte();

  if (data.length === 0) {
    return (
      <Card className="overflow-hidden p-4">
        <div className="rounded-md p-8 text-center text-sm text-muted-foreground">
          Nenhum acesso de suporte concedido até o momento.
        </div>
      </Card>
    );
  }

  /**
   * `status` é o valor gravado no banco, que só é atualizado para
   * "expirado" quando o backend revalida o acesso (via requisição com
   * X-Acesso-Suporte-Id) ou pelo comando agendado `acesso-suporte:expirar-
   * -vencidos`. Entre uma expiração real e essa atualização, `status` pode
   * ficar defasado como "ativo". `ativo`, por outro lado, já vem calculado
   * pelo backend considerando data/hora atuais (AcessoSuporte::estaValido()),
   * então é sempre a fonte da verdade para o que exibimos — um acesso
   * vencido nunca deve continuar aparecendo como "Ativo" só porque estava
   * assim armazenado.
   */
  function statusEfetivo(acesso: AcessoSuporte): string {
    if (acesso.status === "ativo" && !acesso.ativo) {
      return "expirado";
    }
    return acesso.status;
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "ativo":
        return <Badge className="bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400">Ativo</Badge>;
      case "expirado":
        return <Badge className="bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400">Expirado</Badge>;
      case "revogado":
        return <Badge className="bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400">Revogado</Badge>;
      case "encerrado":
        return <Badge className="bg-slate-100 dark:bg-slate-950/30 text-slate-700 dark:text-slate-400">Encerrado</Badge>;
    }
  }

  return (
    <>
      <Card className="overflow-hidden p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Administrador</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expira em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((acesso) => (
              <TableRow key={acesso.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{acesso.admin.nome ?? "—"}</span>
                    <span className="text-xs text-muted-foreground">{acesso.admin.email}</span>
                  </div>
                </TableCell>
                <TableCell className="max-w-64 truncate text-sm text-muted-foreground">
                  {acesso.motivo ?? "—"}
                </TableCell>
                <TableCell>
                  { getStatusBadge(statusEfetivo(acesso)) }
                </TableCell>
                <TableCell className="text-sm">{formatDate(acesso.expiraEm)}</TableCell>
                <TableCell className="text-right">
                  {acesso.ativo && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="gap-1.5"
                      onClick={() => setParaRevogar(acesso)}
                    >
                      <ShieldOff className="size-3.5" />
                      Revogar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>


      <AlertDialog open={!!paraRevogar} onOpenChange={(open) => !open && setParaRevogar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revogar acesso de suporte?</AlertDialogTitle>
            <AlertDialogDescription>
              O acesso de suporte de{" "}
              <strong>{paraRevogar?.admin.nome}</strong> será encerrado imediatamente,
              mesmo que o período concedido ainda não tenha terminado.

              <span className="mt-2 block">
                Esta ação não pode ser desfeita. Caso o suporte precise continuar, será
                necessário conceder um novo acesso.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              className="gap-1.5 bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (!paraRevogar) return;
                revogar(paraRevogar.id, {
                  onSuccess: () => setParaRevogar(null),
                });
              }}
            >
              {isPending && <Loader2 className="size-3.5 animate-spin" />}
              Revogar acesso
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
