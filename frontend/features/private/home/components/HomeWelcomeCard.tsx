"use client";

import { Sparkles } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import { useUserPrivate } from "@/hooks/use-user-private";
import { formatDate } from "@/lib/utils";

function primeiroNome(nomeCompleto?: string) {
  if (!nomeCompleto) return "";
  return nomeCompleto.trim().split(" ")[0];
}

export function HomeWelcomeCard() {
  const { data: userPrivate } = useUserPrivate();
  const nome = primeiroNome(userPrivate?.nome);

  return (
    <Card className="from-primary/5 to-card bg-gradient-to-t shadow-xs">
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-full">
            <Sparkles className="size-5" />
          </span>
          <div>
            <p className="text-lg font-semibold tracking-tight">
              {nome ? `Olá, ${nome}! 👋` : "Olá! 👋"}
            </p>
            <p className="text-muted-foreground text-sm">
              Seja bem-vindo(a) de volta à sua área.
            </p>
          </div>
        </div>

        {userPrivate?.ultimo_login_em && (
          <p className="text-muted-foreground shrink-0 text-xs">
            Último acesso em {formatDate(userPrivate.ultimo_login_em)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
