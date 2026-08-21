"use client";

import { useEffect, useRef, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { CheckCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useCaixaMensagemContador } from "@/app/admin/providers/caixa-mensagem-contador-provider";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useCaixaMensagensInfinita } from "@/domains/admin/mensagem/hooks/useCaixaMensagensInfinita";
import { useMarcarCaixaMensagemComoLida } from "@/domains/admin/mensagem/hooks/useMarcarCaixaMensagemComoLida";
import { useMarcarTodasCaixaMensagensComoLidas } from "@/domains/admin/mensagem/hooks/useMarcarTodasCaixaMensagensComoLidas";

import { CaixaMensagemItem } from "./CaixaMensagemItem";

type FiltroMensagem = "todas" | "nao_lidas" | "lidas";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FILTRO_PARA_LIDA: Record<FiltroMensagem, boolean | undefined> = {
  todas: undefined,
  nao_lidas: false,
  lidas: true,
};

/**
 * Mesmo padrão do Sheet de mensagens da área Private (ver
 * features/private/mensagem/components/MensagensSheet.tsx): carregamento
 * incremental (infinite scroll) conforme o painel é rolado, com o filtro
 * Todas/Não lidas/Lidas resolvido pelo backend (`lida`), em vez de um lote
 * fixo carregado de uma vez e recortado em memória.
 */
export function CaixaMensagensSheet({ open, onOpenChange }: Props) {
  const [filtro, setFiltro] = useState<FiltroMensagem>("todas");
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useCaixaMensagensInfinita({ lida: FILTRO_PARA_LIDA[filtro], enabled: open });

  const mensagens = data?.pages.flatMap((pagina) => pagina.data) ?? [];

  // Contador dedicado, independente de quantas mensagens já foram
  // carregadas pela rolagem. Vem do provider persistente (mesma instância
  // que alimenta o sino).
  const totalNaoLidas = useCaixaMensagemContador();

  // Mesmo ajuste do Private (ver MensagensSheet.tsx): força revalidar o
  // contador assim que o painel abre, em vez de esperar o próximo ciclo de
  // polling (até 60s) — evita a mensagem aparecer na lista sem o badge do
  // sino refletir isso até um reload.
  useEffect(() => {
    if (open) {
      queryClient.invalidateQueries({
        queryKey: ["mensagens-caixa-admin-contador-nao-lidas"],
      });
    }
  }, [open, queryClient]);

  const { mutate: marcarComoLida, isPending: isMarcandoComoLida } =
    useMarcarCaixaMensagemComoLida();

  const { mutate: marcarTodasComoLidas, isPending: isMarcandoTodasComoLidas } =
    useMarcarTodasCaixaMensagensComoLidas();

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

  function handleScroll() {
    const el = scrollRef.current;
    if (!el || isFetchingNextPage || !hasNextPage) return;

    const proximoDoFim = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (proximoDoFim) {
      fetchNextPage();
    }
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

          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3 pb-4"
          >
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Carregando mensagens...
              </p>
            ) : mensagens.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma mensagem encontrada.
              </p>
            ) : (
              <>
                {mensagens.map((mensagem) => (
                  <CaixaMensagemItem
                    key={mensagem.id}
                    mensagem={mensagem}
                    onMarcarComoLida={handleMarcarComoLida}
                    isMarcandoComoLida={isMarcandoComoLida}
                  />
                ))}

                {isFetchingNextPage && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Carregando mais mensagens...
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
