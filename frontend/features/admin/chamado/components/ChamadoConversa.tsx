"use client";

import { useEffect, useRef, useState } from "react";

import { Send } from "lucide-react";
import { toast } from "sonner";

import { AdminPermissionGuard } from "@/app/admin/_components/guard/AdminPermissionGuard";

import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { AnexosUploader, AnexoValue } from "@/components/upload/AnexosUploader";


import {
  CHAMADO_ANEXO_MIMES,
  CHAMADO_ANEXO_EXTENSOES,
  CHAMADO_ANEXO_TAMANHO_MAXIMO_KB,
  CHAMADO_ANEXOS_MAXIMO_POR_MENSAGEM,
} from "@/constants/chamado-prioridade";
import { getChamadoPrioridadeBadge, getChamadoPrioridadeLabel } from "@/constants/chamado-prioridade";
import {
  chamadoBloqueiaMensagens,
  CHAMADO_STATUS_OPTIONS,
  getChamadoStatusBadge,
  getChamadoStatusIcon,
  getChamadoStatusLabel,
} from "@/constants/chamado-status";
import { ChamadoStatus } from "@/constants/chamado-status";
import { getChamadoTipoLabel } from "@/constants/chamado-tipo";
import { useAtualizarStatusChamado } from "@/domains/admin/chamado/hooks/useAtualizarStatusChamado";
import { useResponderChamado } from "@/domains/admin/chamado/hooks/useResponderChamado";
import { Chamado } from "@/domains/admin/chamado/types/chamado.model";
import { useUserAdmin } from "@/hooks/use-user-admin";
import { formatDate } from "@/lib/utils";

import { ChamadoMensagemBubble } from "./ChamadoMensagemBubble";

interface Props {
  chamado: Chamado;
}

export function ChamadoConversa({ chamado }: Props) {
  const [resposta, setResposta] = useState("");
  const [anexos, setAnexos] = useState<AnexoValue[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: usuario } = useUserAdmin();
  const { mutate: responder, isPending } = useResponderChamado(chamado.id);
  const { mutate: atualizarStatus, isPending: atualizandoStatus } = useAtualizarStatusChamado(chamado.id);

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

  function handleAlterarStatus(status: string) {
    atualizarStatus(status as ChamadoStatus, {
      onSuccess: () => toast.success("Status atualizado."),
      onError: () => toast.error("Não foi possível atualizar o status."),
    });
  }

  return (
    <Card className="flex h-[calc(100vh-220px)] min-h-[500px] flex-col overflow-hidden p-0 shadow-sm">
      <div className="flex flex-col gap-3 border-b px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{chamado.ticket}</span>
            <Badge variant="outline">{getChamadoTipoLabel(chamado.tipo)}</Badge>
            <Badge className={`font-normal ${getChamadoPrioridadeBadge(chamado.prioridade)}`}>
              {getChamadoPrioridadeLabel(chamado.prioridade)}
            </Badge>
          </div>

          <AdminPermissionGuard permission="admin.chamado.gerenciar">
            <Select
              value={chamado.status}
              onValueChange={handleAlterarStatus}
              disabled={atualizandoStatus}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHAMADO_STATUS_OPTIONS.map((opcao) => (
                  <SelectItem key={opcao.value} value={opcao.value}>
                    {opcao.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </AdminPermissionGuard>
        </div>

        <div>
          <h1 className="text-lg font-semibold tracking-tight">{chamado.assunto}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge className={`gap-1.5 font-normal ${getChamadoStatusBadge(chamado.status)}`}>
              <StatusIcon className="size-3.5" />
              {getChamadoStatusLabel(chamado.status)}
            </Badge>
            Cliente: {chamado.cliente.nome} • Aberto em {formatDate(chamado.abertoEm)}
          </p>
        </div>
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
        <AdminPermissionGuard permission="admin.chamado.responder">
          {encerrado ? (
            <p className="text-center text-sm text-muted-foreground">
              Este chamado não aceita novas mensagens no status atual.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              <RichTextEditor
                value={resposta}
                onChange={setResposta}
                placeholder="Digite sua resposta..."
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
                  <Send className="size-4" />
                  Enviar
                </Button>
              </div>
            </div>
          )}
        </AdminPermissionGuard>
      </CardContent>
    </Card>
  );
}
