"use client";

import { Loader2, LogOut, Monitor } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useEncerrarSessao } from "@/domain/admin/perfil/hooks/useEncerrarSessao";
import { useUsuarioSessoes } from "@/domain/admin/perfil/hooks/useUsuarioSessoes";
import { formatDate } from "@/lib/utils";

export function SessoesSection() {
  const {
    data: sessoes,
    isLoading: loadingSessoes,
    isError: erroSessoes,
  } = useUsuarioSessoes();

  const encerrarSessaoMutation = useEncerrarSessao();

  return (
    <Card className="rounded-2xl h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor size={18} />
          Sessões
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {loadingSessoes && (
          <div className="flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}

        {erroSessoes && <p className="text-sm text-red-500">Erro ao carregar sessões.</p>}

        {!loadingSessoes && sessoes?.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma sessão ativa encontrada.</p>
        )}

        {sessoes?.map((sessao) => (
          <div key={sessao.id} className="flex items-center justify-between border rounded-xl p-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {sessao.dispositivo ? sessao.dispositivo : "---"}
                {sessao.plataforma ? ` - ${sessao.plataforma}` : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                ID: {sessao.id} <br />
                IP: {sessao.ip} <br />
                Navegador: {sessao.browser} <br />
                Ultimo Acesso: {formatDate(sessao.ultimo_acesso_em)} <br />
              </p>
              {sessao.atual && (
                <Badge className="bg-emerald-100 text-emerald-700">Sessão atual</Badge>
              )}
            </div>

            {!sessao.atual && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() =>
                  encerrarSessaoMutation.mutate(sessao.id, {
                    onSuccess: () => toast.success("Sessão encerrada com sucesso!"),
                  })
                }
                disabled={encerrarSessaoMutation.isPending}
              >
                {encerrarSessaoMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut size={14} />
                )}
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
