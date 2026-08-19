/**
 * Ponto único de leitura/escrita do Acesso de Suporte ativo no navegador.
 *
 * Usa sessionStorage (não localStorage) de propósito: o modo de suporte é
 * escopado à ABA atual. Isso evita que abrir uma nova aba para trabalho
 * normal do Admin "herde" acidentalmente um modo de suporte ativo em outra
 * aba, o que contraria o requisito de deixar sempre claro, sem ambiguidade,
 * quando o Admin está ou não atuando em nome de um cliente.
 *
 * Isto é APENAS estado de UI. A autorização real é sempre validada pelo
 * backend a cada requisição (ver AcessoSuporteMiddleware) — nada aqui
 * concede acesso a nada; só controla se o header X-Acesso-Suporte-Id é
 * enviado e o que o banner do topo mostra.
 */

export interface AcessoSuporteAtivo {
  id: string;
  entidadeNome: string;
  /** ISO 8601 — mesmo valor de `expira_em` retornado pela API. */
  expiraEm: string | null;
}

const STORAGE_KEY = "acesso_suporte_ativo";
const EVENTO_ALTERADO = "acesso-suporte:alterado";

export function obterAcessoSuporteAtivo(): AcessoSuporteAtivo | null {
  if (typeof window === "undefined") {
    return null;
  }

  const bruto = window.sessionStorage.getItem(STORAGE_KEY);

  if (!bruto) {
    return null;
  }

  try {
    const acesso = JSON.parse(bruto) as AcessoSuporteAtivo;

    // Proteção extra client-side: mesmo sem depender disso para
    // segurança, não faz sentido continuar mandando o header de um
    // acesso cujo horário de expiração (segundo o próprio backend) já
    // passou — evita uma requisição desnecessária fadada ao 403.
    if (
      acesso.expiraEm &&
      new Date(acesso.expiraEm).getTime() <= Date.now()
    ) {
      limparAcessoSuporteAtivo();
      return null;
    }

    return acesso;
  } catch {
    return null;
  }
}

export function definirAcessoSuporteAtivo(acesso: AcessoSuporteAtivo): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(acesso));
  window.dispatchEvent(new CustomEvent(EVENTO_ALTERADO));
}

export function limparAcessoSuporteAtivo(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(EVENTO_ALTERADO));
}

export function assinarAlteracoesAcessoSuporte(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener(EVENTO_ALTERADO, callback);
  // Cobre o caso de múltiplas abas da MESMA origem usando sessionStorage
  // de outra aba não se aplica (sessionStorage não é compartilhado entre
  // abas), mas o listener "storage" nativo é mantido por segurança/futuro.
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(EVENTO_ALTERADO, callback);
    window.removeEventListener("storage", callback);
  };
}
