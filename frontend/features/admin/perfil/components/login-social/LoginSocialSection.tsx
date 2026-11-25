"use client";

import { useState } from "react";

import { AxiosError } from "axios";
import { Link2, Link2Off, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { ApiErrorResponse } from "@/types/errors";

import { AppAlert } from "@/components/feedback/AppAlert";
import { IconeProvedorSocial } from "@/components/forms/provedor-social-icone";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

import {
  useDesvincularLoginSocial,
  useIniciarVinculoLoginSocial,
  useLoginSocial,
} from "@/domains/admin/perfil/login-social/hooks/useLoginSocial";
import { VinculoSocial } from "@/domains/admin/perfil/login-social/types/loginSocial.model";
import { formatDate } from "@/lib/utils";

export function LoginSocialSection() {
  const { data, isLoading, isError } = useLoginSocial();

  const iniciarMutation = useIniciarVinculoLoginSocial();
  const desvincularMutation = useDesvincularLoginSocial();

  const [paraVincular, setParaVincular] = useState<VinculoSocial | null>(null);
  const [paraDesvincular, setParaDesvincular] = useState<VinculoSocial | null>(null);
  const [senha, setSenha] = useState("");
  const [erros, setErros] = useState<string[] | null>(null);

  function fecharVincular() {
    setParaVincular(null);
    setSenha("");
    setErros(null);
  }

  function handleVincular() {
    if (!paraVincular || !senha) return;

    setErros(null);

    iniciarMutation.mutate(
      { provedor: paraVincular.chave, senha },
      {
        // Navegação completa: o provedor assume a tela e devolve ao BFF, que volta para esta aba.
        onSuccess: (resposta) => window.location.assign(resposta.data.url),
        onError: (error: AxiosError<ApiErrorResponse>) => {
          setErros(error.response?.data?.errors?.business ?? ["Não foi possível iniciar o vínculo."]);
        },
      }
    );
  }

  function handleDesvincular() {
    if (!paraDesvincular) return;

    const nome = paraDesvincular.nome;

    desvincularMutation.mutate(paraDesvincular.chave, {
      onSuccess: () => toast.success(`Conta ${nome} desvinculada com sucesso!`),
      onError: (error: AxiosError<ApiErrorResponse>) =>
        toast.error(error.response?.data?.errors?.business?.[0] ?? "Não foi possível desvincular a conta."),
      onSettled: () => setParaDesvincular(null),
    });
  }

  const provedores = data?.data ?? [];

  return (
    <>
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 size={18} />
            Contas conectadas
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Vincule uma conta para entrar sem digitar a senha. O login por e-mail e senha continua
            funcionando.
          </p>
        </CardHeader>

        <CardContent className="space-y-3">
          {isLoading && (
            <>
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </>
          )}

          {isError && <p className="text-sm text-red-500">Erro ao carregar as contas conectadas.</p>}

          {!isLoading && !isError && provedores.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum provedor de login social disponível.</p>
          )}

          {provedores.map((provedor) => (
            <div
              key={provedor.chave}
              className="flex items-center justify-between gap-3 border rounded-xl p-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <IconeProvedorSocial chave={provedor.chave} />

                <div className="space-y-1 min-w-0">
                  <p className="text-sm font-medium flex items-center gap-2">
                    {provedor.nome}
                    {provedor.vinculado ? (
                      <Badge className="bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400">
                        Vinculado
                      </Badge>
                    ) : (
                      <Badge variant="outline">Não vinculado</Badge>
                    )}
                    {!provedor.disponivel && <Badge variant="outline">Indisponível no momento</Badge>}
                  </p>

                  {provedor.vinculado && (
                    <p className="text-xs text-muted-foreground break-all">
                      {provedor.email}
                      <br />
                      Vinculado em: {formatDate(provedor.vinculadoEm)}
                      <br />
                      Último acesso: {provedor.ultimoLoginEm ? formatDate(provedor.ultimoLoginEm) : "Nunca"}
                    </p>
                  )}
                </div>
              </div>

              {provedor.vinculado ? (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setParaDesvincular(provedor)}
                  disabled={desvincularMutation.isPending}
                >
                  <Link2Off size={14} />
                  Desvincular
                </Button>
              ) : (
                <Button size="sm" onClick={() => setParaVincular(provedor)} disabled={!provedor.disponivel}>
                  <Link2 size={14} />
                  Vincular
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={paraVincular !== null} onOpenChange={(open) => !open && fecharVincular()}>
        <DialogContent className="space-y-6">
          <DialogHeader>
            <DialogTitle>Vincular conta {paraVincular?.nome}</DialogTitle>
            <DialogDescription>
              Por segurança, confirme a sua senha. Em seguida você será levado ao {paraVincular?.nome}{" "}
              para autorizar o vínculo.
            </DialogDescription>
          </DialogHeader>

          {erros && (
            <AppAlert variant="error" subtitle="Erro" messages={erros} onClose={() => setErros(null)} />
          )}

          <Input
            type="password"
            placeholder="Digite sua senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleVincular()}
            disabled={iniciarMutation.isPending}
            autoComplete="current-password"
          />

          <Button
            onClick={handleVincular}
            className="w-full"
            disabled={!senha || iniciarMutation.isPending}
          >
            {iniciarMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continuar com {paraVincular?.nome}
          </Button>
        </DialogContent>
      </Dialog>

      <AlertDialog open={paraDesvincular !== null} onOpenChange={(open) => !open && setParaDesvincular(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desvincular conta {paraDesvincular?.nome}</AlertDialogTitle>
            <AlertDialogDescription>
              Você não poderá mais entrar com o {paraDesvincular?.nome}, mas continuará entrando com
              e-mail e senha. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDesvincular} className="bg-red-700 hover:bg-red-800">
              Desvincular
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
