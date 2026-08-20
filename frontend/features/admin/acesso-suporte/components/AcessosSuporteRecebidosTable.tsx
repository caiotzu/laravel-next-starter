"use client";

import { useState } from "react";

import { Loader2, LogIn, ShieldOff } from "lucide-react";

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

import { useEncerrarAcessoSuporte } from "@/domains/admin/acesso-suporte/hooks/useEncerrarAcessoSuporte";
import { AcessoSuporte } from "@/domains/admin/acesso-suporte/types/acessoSuporte.model";

function formatarData(data: string | null): string {
  if (!data) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(data));
}

export function AcessosSuporteRecebidosTable({ data }: { data: AcessoSuporte[] }) {
  const [paraEncerrar, setParaEncerrar] = useState<AcessoSuporte | null>(null);

  const { mutate: encerrar, isPending } = useEncerrarAcessoSuporte();

  if (data.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        Nenhum acesso de suporte recebido até o momento.
      </div>
    );
  }

  function handleEntrar(acesso: AcessoSuporte) {
    const url = `/dashboard?acesso_suporte_id=${encodeURIComponent(acesso.id)}`;
    window.open(url, "_blank", "noopener,noreferrer");
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
              <TableHead>Entidade</TableHead>
              <TableHead>Concedido por</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expira em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((acesso) => {
              return (
                <TableRow key={acesso.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{acesso.entidade.nome ?? "—"}</span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {acesso.entidade.tipo}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{acesso.concedidoPor.nome ?? "—"}</span>
                      <span className="text-xs text-muted-foreground">
                        {acesso.concedidoPor.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-64 truncate text-sm text-muted-foreground">
                    {acesso.motivo ?? "—"}
                  </TableCell>
                  <TableCell>
                    { getStatusBadge(statusEfetivo(acesso)) }
                  </TableCell>
                  <TableCell className="text-sm">{formatarData(acesso.expiraEm)}</TableCell>
                  <TableCell className="text-right">
                    {acesso.ativo && (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          className="gap-1.5"
                          onClick={() => handleEntrar(acesso)}
                        >
                          <LogIn className="size-3.5" />
                          Acessar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-1.5"
                          onClick={() => setParaEncerrar(acesso)}
                        >
                          <ShieldOff className="size-3.5" />
                          Encerrar
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>


      <AlertDialog open={!!paraEncerrar} onOpenChange={(open) => !open && setParaEncerrar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Encerrar acesso de suporte?</AlertDialogTitle>
            <AlertDialogDescription>
              Você deixará de conseguir acessar os dados de{" "}
              <strong>{paraEncerrar?.entidade.nome}</strong>. Essa ação não pode ser desfeita —
              o cliente precisará conceder um novo acesso caso o suporte precise continuar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              className="gap-1.5 bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (!paraEncerrar) return;
                encerrar(paraEncerrar.id, {
                  onSuccess: () => setParaEncerrar(null),
                });
              }}
            >
              {isPending && <Loader2 className="size-3.5 animate-spin" />}
              Encerrar acesso
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
