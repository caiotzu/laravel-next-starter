"use client";

import { useEffect, useRef, useState } from "react";

import { Send } from "lucide-react";
import { toast } from "sonner";

import { AdminPermissionGuard } from "@/app/admin/_components/guard/AdminPermissionGuard";

import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
  CHAMADO_PRIORIDADE_OPTIONS,
  getChamadoPrioridadeBadge,
  getChamadoPrioridadeLabel,
} from "@/constants/chamado-prioridade";
import { ChamadoPrioridade } from "@/constants/chamado-prioridade";
import { ChamadoStatus } from "@/constants/chamado-status";
import {
  chamadoBloqueiaMensagens,
  CHAMADO_STATUS_OPTIONS,
  getChamadoStatusBadge,
  getChamadoStatusIcon,
  getChamadoStatusLabel,
} from "@/constants/chamado-status";
import { getChamadoTipoLabel } from "@/constants/chamado-tipo";
import { useAtribuirResponsavelChamado } from "@/domains/admin/chamado/hooks/useAtribuirResponsavelChamado";
import { useAtualizarPrioridadeChamado } from "@/domains/admin/chamado/hooks/useAtualizarPrioridadeChamado";
import { useAtualizarStatusChamado } from "@/domains/admin/chamado/hooks/useAtualizarStatusChamado";
import { useResponderChamado } from "@/domains/admin/chamado/hooks/useResponderChamado";
import { Chamado } from "@/domains/admin/chamado/types/chamado.model";
import { useAdministradores } from "@/domains/admin/lookup/hooks/useAdministradores";
import { useDebouncedValue } from "@/hooks/use-debounce";
import { useUserAdmin } from "@/hooks/use-user-admin";
import { formatDate } from "@/lib/utils";

import { ChamadoMensagemBubble } from "./ChamadoMensagemBubble";

const SEM_RESPONSAVEL = "__sem_responsavel__";

interface Props {
  chamado: Chamado;
}

export function ChamadoConversa({ chamado }: Props) {
  const [resposta, setResposta] = useState("");
  const [anexos, setAnexos] = useState<AnexoValue[]>([]);
  const [buscaResponsavel, setBuscaResponsavel] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const buscaDebounced = useDebouncedValue(buscaResponsavel, 300);

  const { data: usuario } = useUserAdmin();
  const { mutate: responder, isPending } = useResponderChamado(chamado.id);
  const { mutate: atualizarStatus, isPending: atualizandoStatus } = useAtualizarStatusChamado(chamado.id);
  const { mutate: atualizarPrioridade, isPending: atualizandoPrioridade } = useAtualizarPrioridadeChamado(chamado.id);
  const { mutate: atribuirResponsavel, isPending: atribuindoResponsavel } = useAtribuirResponsavelChamado(chamado.id);

  const { data: administradores, isLoading: carregandoAdmins } = useAdministradores({
    busca: buscaDebounced,
  });

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
        onError: (error) => {
          const mensagens = error.response?.data?.errors?.business;

          toast.error(
            mensagens?.[0] ?? "Não foi possível enviar sua mensagem."
          );
        },
      }
    );
  }

  function handleAlterarStatus(status: string) {
    atualizarStatus(status as ChamadoStatus, {
      onSuccess: () => toast.success("Status atualizado."),
      onError: () => toast.error("Não foi possível atualizar o status."),
    });
  }

  function handleAlterarPrioridade(prioridade: string) {
    atualizarPrioridade(prioridade as ChamadoPrioridade, {
      onSuccess: () => toast.success("Prioridade atualizada."),
      onError: () => toast.error("Não foi possível atualizar a prioridade."),
    });
  }

  function handleAlterarResponsavel(valor: string) {
    atribuirResponsavel(valor === SEM_RESPONSAVEL ? null : valor, {
      onSuccess: () => toast.success("Responsável atualizado."),
      onError: () => toast.error("Não foi possível atualizar o responsável."),
    });
  }

  return (
    <Card className="flex h-[calc(100vh-220px)] min-h-[500px] flex-col overflow-hidden p-0 shadow-sm">
      <div className="flex flex-col gap-3 border-b px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{chamado.ticket}</span>
            <Badge variant="outline">{getChamadoTipoLabel(chamado.tipo)}</Badge>
          </div>

          <AdminPermissionGuard permission="admin.chamado.gerenciar" disableFallback={true}>
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

        {/* Prioridade e responsável — mesmos campos já existentes na
            estrutura do chamado (ChamadoPrioridade, responsavel_id), só
            agora com um lugar visível/funcional para defini-los. */}
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Prioridade</Label>
            <AdminPermissionGuard
              permission="admin.chamado.gerenciar"
              fallback={
                <Badge className={`w-fit font-normal ${getChamadoPrioridadeBadge(chamado.prioridade)}`}>
                  {getChamadoPrioridadeLabel(chamado.prioridade)}
                </Badge>
              }
            >
              {encerrado ? (
                // Chamado encerrado (resolvido/fechado/cancelado): prioridade
                // não pode mais ser alterada — mesma regra aplicada no backend
                // (ver ChamadoService::atualizarPrioridade).
                <Badge className={`w-fit font-normal ${getChamadoPrioridadeBadge(chamado.prioridade)}`}>
                  {getChamadoPrioridadeLabel(chamado.prioridade)}
                </Badge>
              ) : (
                <Select
                  value={chamado.prioridade}
                  onValueChange={handleAlterarPrioridade}
                  disabled={atualizandoPrioridade}
                >
                  <SelectTrigger className="h-8 w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHAMADO_PRIORIDADE_OPTIONS.map((opcao) => (
                      <SelectItem key={opcao.value} value={opcao.value}>
                        {opcao.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </AdminPermissionGuard>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Responsável</Label>
            <AdminPermissionGuard
              permission="admin.chamado.gerenciar"
              fallback={
                <span className="text-sm">
                  {chamado.responsavel?.nome ?? "Nenhum responsável definido"}
                </span>
              }
            >
              {encerrado ? (
                // Chamado encerrado (resolvido/fechado/cancelado): responsável
                // não pode mais ser alterado — mesma regra aplicada no backend
                // (ver ChamadoService::atribuirResponsavel).
                <span className="text-sm">
                  {chamado.responsavel?.nome ?? "Nenhum responsável definido"}
                </span>
              ) : (
                <Select
                  value={chamado.responsavel?.id ?? SEM_RESPONSAVEL}
                  onValueChange={handleAlterarResponsavel}
                  disabled={atribuindoResponsavel}
                >
                  <SelectTrigger className="h-8 w-56">
                    <SelectValue placeholder="Nenhum responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 pb-2">
                      <input
                        value={buscaResponsavel}
                        onChange={(e) => setBuscaResponsavel(e.target.value)}
                        placeholder="Buscar por nome ou e-mail..."
                        className="w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring dark:bg-input/30"
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </div>

                    <SelectItem value={SEM_RESPONSAVEL}>Nenhum responsável</SelectItem>

                    {carregandoAdmins && (
                      <div className="px-2 py-2 text-sm text-muted-foreground">Buscando...</div>
                    )}

                    {administradores?.map((admin) => (
                      <SelectItem key={admin.id} value={admin.id}>
                        {admin.nome} — {admin.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </AdminPermissionGuard>
          </div>
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
        <AdminPermissionGuard 
          permission="admin.chamado.responder"
          disableFallback={true}
        >
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
