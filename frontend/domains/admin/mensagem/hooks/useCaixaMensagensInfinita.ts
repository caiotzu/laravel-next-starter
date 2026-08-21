"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { listarCaixaMensagens } from "../services/caixaMensagemService";

const POR_PAGINA = 20;

interface Params {
  lida?: boolean;
  enabled: boolean;
}

/**
 * Mesmo padrão do private (ver domains/private/mensagem/hooks/
 * useMensagensInfinita.ts): carregamento incremental conforme o painel é
 * rolado, com o filtro Todas/Não lidas/Lidas resolvido pelo backend em vez
 * de recortado em memória sobre um lote fixo.
 */
export function useCaixaMensagensInfinita({ lida, enabled }: Params) {
  return useInfiniteQuery({
    // Aninhada sob "mensagens-caixa-admin", mesmo prefixo usado pelo
    // invalidateQueries das mutações de marcar como lida.
    queryKey: ["mensagens-caixa-admin", "infinita", { lida }],
    queryFn: ({ pageParam }) =>
      listarCaixaMensagens({ lida, page: pageParam, por_pagina: POR_PAGINA }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.current_page < lastPage.meta.last_page
        ? lastPage.meta.current_page + 1
        : undefined,
    enabled,
  });
}
