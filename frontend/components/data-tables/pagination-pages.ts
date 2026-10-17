/**
 * Itens da barra de paginação: números de página e marcadores de reticências.
 *
 * Sempre inclui a primeira e a ÚLTIMA página (para ir direto a elas, sem clicar em "Próximo"
 * várias vezes) e uma janela ao redor da atual. O tamanho é constante (7 itens) quando há mais
 * de 7 páginas, para a barra não "pular" de largura ao navegar.
 */
export type ItemPaginacao = number | "reticencias-inicio" | "reticencias-fim";

const IRMAOS = 1; // páginas vizinhas de cada lado da atual
const MAXIMO_SEM_RETICENCIAS = IRMAOS * 2 + 5; // primeira + última + atual + vizinhas + 2 reticências

function intervalo(inicio: number, fim: number): number[] {
  return Array.from({ length: fim - inicio + 1 }, (_, i) => inicio + i);
}

export function gerarPaginas(paginaAtual: number, ultimaPagina: number): ItemPaginacao[] {
  if (ultimaPagina <= MAXIMO_SEM_RETICENCIAS) {
    return intervalo(1, Math.max(1, ultimaPagina));
  }

  const esquerda = Math.max(paginaAtual - IRMAOS, 1);
  const direita = Math.min(paginaAtual + IRMAOS, ultimaPagina);

  const mostraReticenciasInicio = esquerda > 2;
  const mostraReticenciasFim = direita < ultimaPagina - 1;
  const blocoNaPonta = IRMAOS * 2 + 3;

  if (!mostraReticenciasInicio && mostraReticenciasFim) {
    return [...intervalo(1, blocoNaPonta), "reticencias-fim", ultimaPagina];
  }

  if (mostraReticenciasInicio && !mostraReticenciasFim) {
    return [1, "reticencias-inicio", ...intervalo(ultimaPagina - blocoNaPonta + 1, ultimaPagina)];
  }

  return [1, "reticencias-inicio", ...intervalo(esquerda, direita), "reticencias-fim", ultimaPagina];
}
