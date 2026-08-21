"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { listarMensagens } from "../services/mensagemService";

const POR_PAGINA = 20;

interface Params {
  lida?: boolean;
  enabled: boolean;
}

/**
 * Carregamento incremental (infinite scroll) da caixa de mensagens — mais
 * adequado que paginação tradicional aqui, já que a listagem vive dentro de
 * um Sheet/painel rolável (não uma página com controles de página). O
 * filtro `lida` agora é resolvido pelo backend (ver Global\MensagemController
 * ::listar), em vez de buscar um lote fixo e filtrar em memória — a troca de
 * aba (Todas/Não lidas/Lidas) gera uma nova query encadeada (nova
 * queryKey), reiniciando do zero, do jeito que o próprio useInfiniteQuery
 * já lida nativamente sem código extra de "reset".
 */
export function useMensagensInfinita({ lida, enabled }: Params) {
  return useInfiniteQuery({
    // Aninhada sob o mesmo prefixo "mensagens-private" usado pelas
    // mutações (marcar como lida / marcar todas), cujo invalidateQueries
    // usa esse prefixo — assim a lista infinita também é invalidada.
    queryKey: ["mensagens-private", "infinita", { lida }],
    queryFn: ({ pageParam }) =>
      listarMensagens({ lida, page: pageParam, por_pagina: POR_PAGINA }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.current_page < lastPage.meta.last_page
        ? lastPage.meta.current_page + 1
        : undefined,
    enabled,
  });
}
