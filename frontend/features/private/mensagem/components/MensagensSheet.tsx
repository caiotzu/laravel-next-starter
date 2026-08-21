"use client";

import { useRef, useState } from "react";

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

import { useContadorMensagensNaoLidas } from "@/domains/private/mensagem/hooks/useContadorMensagensNaoLidas";
import { useMarcarMensagemComoLida } from "@/domains/private/mensagem/hooks/useMarcarMensagemComoLida";
import { useMarcarTodasMensagensComoLidas } from "@/domains/private/mensagem/hooks/useMarcarTodasMensagensComoLidas";
import { useMensagensInfinita } from "@/domains/private/mensagem/hooks/useMensagensInfinita";

import { MensagemItem } from "./MensagemItem";

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
 * Carrega as mensagens sob demanda conforme o usuário rola o painel
 * (infinite scroll) em vez de buscar um lote fixo inteiro de uma vez — o
 * filtro Todas/Não lidas/Lidas agora é resolvido pelo backend (parâmetro
 * `lida`), então trocar de aba gera uma nova lista paginada do zero, em vez
 * de recortar em memória um snapshot que pode nem conter os itens da aba.
 */
export function MensagensSheet({ open, onOpenChange }: Props) {
  const [filtro, setFiltro] = useState<FiltroMensagem>("todas");
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useMensagensInfinita({ lida: FILTRO_PARA_LIDA[filtro], enabled: open });

  const mensagens = data?.pages.flatMap((pagina) => pagina.data) ?? [];

  // Contador dedicado (independe de quantas mensagens já foram carregadas
  // na rolagem), evitando que "Marcar todas como lidas" suma/apareça de
  // forma inconsistente com o que ainda não foi rolado até o fim.
  const { data: totalNaoLidas = 0 } = useContadorMensagensNaoLidas();

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
                  <MensagemItem
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
