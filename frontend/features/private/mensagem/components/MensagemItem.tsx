"use client";

import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Mensagem } from "@/domains/private/mensagem/types/mensagem.model";
import { formatDate } from "@/lib/utils";


interface Props {
  mensagem: Mensagem;
  onMarcarComoLida: (mensagemId: string) => void;
  isMarcandoComoLida?: boolean;
}

export function MensagemItem({ mensagem, onMarcarComoLida, isMarcandoComoLida = false }: Props) {
  return (
    <div
      className={`rounded-xl border p-4 flex flex-col gap-2 transition-colors ${
        mensagem.lida
          ? "bg-background"
          : "bg-muted/40 border-primary/30"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {!mensagem.lida && (
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
          )}
          <p className="font-medium text-sm leading-tight">{mensagem.titulo}</p>
        </div>

        {mensagem.origem === "sistema" && (
          <Badge variant="secondary" className="shrink-0">
            Sistema
          </Badge>
        )}
      </div>

      <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
        {mensagem.conteudo}
      </p>

      <div className="flex items-center justify-between gap-2 mt-1">
        <span className="text-xs text-muted-foreground">
          {formatDate(mensagem.createdAt)}
        </span>

        {!mensagem.lida && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs cursor-pointer"
            disabled={isMarcandoComoLida}
            onClick={() => onMarcarComoLida(mensagem.mensagemId)}
          >
            <Check className="h-3.5 w-3.5" />
            Marcar como lida
          </Button>
        )}
      </div>
    </div>
  );
}
