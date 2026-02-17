"use client";

import { useState } from "react";

import { ShieldCheck, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { useUsuarioSessoes } from "../hooks/useUsuarioSessoes";

export function SegurancaTabContent() {
  const { data: sessoes } = useUsuarioSessoes();

  const [password, setPassword] = useState("");

  return (
    <div className="space-y-6">

      {/* 2FA */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck size={18} />
            Autenticação 2FA
          </CardTitle>
        </CardHeader>

        <CardContent>
          <Button>Habilitar 2FA</Button>
        </CardContent>
      </Card>

      {/* Sessões */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Sessões Ativas</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {sessoes?.map((sessao) => (
            <div
              key={sessao.id}
              className="flex items-center justify-between border rounded-lg p-4"
            >
              <div>
                <p className="font-medium">{sessao.browser}</p>
                <p className="text-sm text-muted-foreground">
                  IP: {sessao.ip}
                </p>
              </div>

              <Button variant="destructive" size="sm">
                <LogOut size={16} />
                Encerrar
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Alterar senha */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Alterar Senha</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 max-w-md">
          <Input
            type="password"
            placeholder="Nova senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button>Atualizar Senha</Button>
        </CardContent>
      </Card>

    </div>
  );
}
