"use client";

import { useMemo, useState } from "react";

import { CheckCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useMarcarMensagemComoLida } from "@/domains/private/mensagem/hooks/useMarcarMensagemComoLida";
import { useMarcarTodasMensagensComoLidas } from "@/domains/private/mensagem/hooks/useMarcarTodasMensagensComoLidas";
import { useMensagens } from "@/domains/private/mensagem/hooks/useMensagens";

import { MensagemItem } from "./MensagemItem";

type FiltroMensagem = "todas" | "nao_lidas" | "lidas";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Busca uma única página com um volume alto de mensagens (mais recentes) e
 * filtra localmente ao trocar de aba, evitando uma requisição ao backend a
 * cada troca de filtro (Todas / Não lidas / Lidas), conforme especificado.
 */
const QUANTIDADE_CARREGADA = 100;

export function MensagensSheet({ open, onOpenChange }: Props) {
  const [filtro, setFiltro] = useState<FiltroMensagem>("todas");

  const { data, isLoading } = useMensagens(
    { por_pagina: QUANTIDADE_CARREGADA, page: 1 },
    open
  );

  const mensagens = useMemo(() => data?.data ?? [], [data]);

  const mensagensFiltradas = useMemo(() => {
    if (filtro === "nao_lidas") return mensagens.filter((m) => !m.lida);
    if (filtro === "lidas") return mensagens.filter((m) => m.lida);
    return mensagens;
  }, [mensagens, filtro]);

  const totalNaoLidas = useMemo(
    () => mensagens.filter((m) => !m.lida).length,
    [mensagens]
  );

  const { mutate: marcarComoLida, isPending: isMarcandoComoLida } =
    useMarcarMensagemComoLida();

  const { mutate: marcarTodasComoLidas, isPending: isMarcandoTodasComoLidas } =
    useMarcarTodasMensagensComoLidas();

  function handleMarcarComoLida(mensagemId: string) {
    marcarComoLida(mensagemId, {
      onError: () => toast.error("Não foi possível marcar a mensagem como lida."),
    });
  }

  function handleMarcarTodasComoLidas() {
    marcarTodasComoLidas(undefined, {
      onSuccess: () => toast.success("Todas as mensagens foram marcadas como lidas."),
      onError: () => toast.error("Não foi possível marcar as mensagens como lidas."),
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md w-full">
        <SheetHeader>
          <SheetTitle>Mensagens</SheetTitle>
          <SheetDescription>
            Acompanhe as mensagens e notificações recebidas.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 flex-1 min-h-0">
          <div className="flex items-center justify-between gap-2">
            <Tabs value={filtro} onValueChange={(value) => setFiltro(value as FiltroMensagem)}>
              <TabsList>
                <TabsTrigger value="todas">Todas</TabsTrigger>
                <TabsTrigger value="nao_lidas">Não lidas</TabsTrigger>
                <TabsTrigger value="lidas">Lidas</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {totalNaoLidas > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start cursor-pointer"
              disabled={isMarcandoTodasComoLidas}
              onClick={handleMarcarTodasComoLidas}
            >
              {isMarcandoTodasComoLidas ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCheck className="h-3.5 w-3.5" />
              )}
              Marcar todas como lidas
            </Button>
          )}

          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3 pb-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Carregando mensagens...
              </p>
            ) : mensagensFiltradas.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma mensagem encontrada.
              </p>
            ) : (
              mensagensFiltradas.map((mensagem) => (
                <MensagemItem
                  key={mensagem.id}
                  mensagem={mensagem}
                  onMarcarComoLida={handleMarcarComoLida}
                  isMarcandoComoLida={isMarcandoComoLida}
                />
              ))
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
