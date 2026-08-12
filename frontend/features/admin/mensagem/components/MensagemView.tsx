"use client";

import { Info } from "@/components/common/Info";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

import { Mensagem } from "@/domains/admin/mensagem/types/mensagem.model";
import { formatDate } from "@/lib/utils";

interface Props {
  mensagem: Mensagem;
}

export function MensagemView({ mensagem }: Props) {
  const direcionamento = mensagem.direcionamento;

  return (
    <div className="flex flex-1 flex-col py-6 space-y-6">
      <div className="rounded-xl shadow-sm border-l-4 border-primary/60 bg-card p-6">
        <div className="flex justify-between items-start mb-6 gap-4">
          <h2 className="text-xl font-semibold">{mensagem.titulo}</h2>

          {mensagem.origem === "sistema" ? (
            <Badge variant="secondary">Sistema</Badge>
          ) : (
            <Badge className="bg-indigo-100 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400">
              Administrador
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
          <Info label="ID" value={mensagem.id} />
          <Info label="Remetente" value={mensagem.remetente?.nome ?? "Sistema"} />
          <Info label="Enviado em" value={formatDate(mensagem.createdAt)} />
          <Info
            label="Leitura"
            value={`${mensagem.totalLidos} de ${mensagem.totalDestinatarios} lidas`}
          />
        </div>
      </div>

      <Card className="p-6 space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Conteúdo</h3>
        <p className="whitespace-pre-wrap break-words text-sm">
          {mensagem.conteudo}
        </p>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Direcionamento
        </h3>

        {direcionamento ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <Info
              label="Tipo"
              value={
                direcionamento.tipo === "grupo_empresa"
                  ? "Grupo de empresa"
                  : "Usuário"
              }
            />

            {direcionamento.tipo === "grupo_empresa" ? (
              <Info
                label="Grupo de empresa"
                value={direcionamento.grupoEmpresaNome ?? "---"}
              />
            ) : (
              <Info
                label="Usuário"
                value={direcionamento.usuarioNome ?? "---"}
              />
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhuma informação de direcionamento disponível.
          </p>
        )}
      </Card>
    </div>
  );
}
