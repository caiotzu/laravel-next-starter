"use client";

import { useEffect, useRef, useState } from "react";

import { Send } from "lucide-react";
import { toast } from "sonner";

import { PrivatePermissionGuard } from "@/app/(private)/_components/guard/PrivatePermissionGuard";

import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AnexosUploader, AnexoValue } from "@/components/upload/AnexosUploader";


import {
  CHAMADO_ANEXO_MIMES,
  CHAMADO_ANEXO_EXTENSOES,
  CHAMADO_ANEXO_TAMANHO_MAXIMO_KB,
  CHAMADO_ANEXOS_MAXIMO_POR_MENSAGEM,
} from "@/constants/chamado-prioridade";
import {
  chamadoBloqueiaMensagens,
  getChamadoStatusBadge,
  getChamadoStatusIcon,
  getChamadoStatusLabel,
} from "@/constants/chamado-status";
import { getChamadoTipoLabel } from "@/constants/chamado-tipo";
import { useResponderChamado } from "@/domains/private/chamado/hooks/useResponderChamado";
import { Chamado } from "@/domains/private/chamado/types/chamado.model";
import { useUserPrivate } from "@/hooks/use-user-private";
import { formatDate } from "@/lib/utils";

import { ChamadoMensagemBubble } from "./ChamadoMensagemBubble";

interface Props {
  chamado: Chamado;
}

export function ChamadoConversa({ chamado }: Props) {
  const [resposta, setResposta] = useState("");
  const [anexos, setAnexos] = useState<AnexoValue[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: usuario } = useUserPrivate();
  const { mutate: responder, isPending } = useResponderChamado(chamado.id);

  const encerrado = chamadoBloqueiaMensagens(chamado.status);
  const StatusIcon = getChamadoStatusIcon(chamado.status);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [chamado.mensagens.length]);

  function handleEnviar() {
    const textoLimpo = resposta.replace(/<[^>]*>/g, "").trim();
    if (!textoLimpo) {
      toast.error("Escreva uma mensagem antes de enviar.");
      return;
    }

    responder(
      {
        mensagem: resposta,
        anexos: anexos.map((a) => ({ nome: a.nome, conteudo: a.conteudo })),
      },
      {
        onSuccess: () => {
          setResposta("");
          setAnexos([]);
        },
        onError: () => toast.error("Não foi possível enviar sua mensagem."),
      }
    );
  }

  return (
    <Card className="flex h-[calc(100vh-220px)] min-h-[500px] flex-col overflow-hidden p-0 shadow-sm">
      <div className="flex flex-col gap-2 border-b px-6 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">{chamado.ticket}</span>
          <Badge className={`gap-1.5 font-normal ${getChamadoStatusBadge(chamado.status)}`}>
            <StatusIcon className="size-3.5" />
            {getChamadoStatusLabel(chamado.status)}
          </Badge>
          <Badge variant="outline">{getChamadoTipoLabel(chamado.tipo)}</Badge>
        </div>
        <h1 className="text-lg font-semibold tracking-tight">{chamado.assunto}</h1>
        <p className="text-xs text-muted-foreground">
          Aberto em {formatDate(chamado.abertoEm)}
          {chamado.fechadoEm && ` • Encerrado em ${formatDate(chamado.fechadoEm)}`}
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4">
        <div className="flex flex-col gap-4">
          {chamado.mensagens.map((mensagem) => (
            <ChamadoMensagemBubble
              key={mensagem.id}
              mensagem={mensagem}
              ehPropria={mensagem.usuario.id === usuario?.id}
            />
          ))}
        </div>
      </div>

      <Separator />

      <CardContent className="px-4 py-4">
        {encerrado ? (
          <p className="text-center text-sm text-muted-foreground">
            Este chamado não aceita novas mensagens no status atual.
          </p>
        ) : (
          <PrivatePermissionGuard permission="private.chamado.responder" disableFallback={true}>
            <div className="flex flex-col gap-3">
              <RichTextEditor
                value={resposta}
                onChange={setResposta}
                placeholder="Digite sua mensagem..."
                minHeightClassName="min-h-[100px]"
              />
              <div className="flex items-center justify-between gap-3">
                <AnexosUploader
                  value={anexos}
                  onChange={setAnexos}
                  maxArquivos={CHAMADO_ANEXOS_MAXIMO_POR_MENSAGEM}
                  tamanhoMaximoKb={CHAMADO_ANEXO_TAMANHO_MAXIMO_KB}
                  mimesPermitidos={CHAMADO_ANEXO_MIMES}
                  extensoesPermitidas={CHAMADO_ANEXO_EXTENSOES}
                  disabled={isPending}
                />

                <Button onClick={handleEnviar} disabled={isPending} className="gap-2">
                  Enviar
                </Button>
              </div>
            </div>
          </PrivatePermissionGuard>
        )}
      </CardContent>
    </Card>
  );
}
