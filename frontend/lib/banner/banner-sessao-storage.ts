/**
 * Ponto único de leitura/escrita de "o usuário já fechou o Banner nesta
 * sessão de login" — usado pelos dois BannerProvider (Admin e Private).
 *
 * Problema que isto resolve (ver item 1 do pedido): guardar esse
 * "fechado" só em estado React (useState/useRef) funciona para navegação
 * dentro do app, mas é perdido a cada reload/remontagem — fazendo o
 * Banner reaparecer mesmo sem um novo login. Guardar com uma chave FIXA
 * resolveria o reload, mas erraria no sentido contrário: um logout
 * seguido de um novo login manteria a marca de "fechado" antiga,
 * escondendo o Banner quando ele deveria voltar a aparecer.
 *
 * A solução, sem depender do token (que continua 100% httpOnly, como
 * deve): a própria tela de login (Admin/Private) chama `marcarNovoLogin`
 * no exato momento em que o login é concluído com sucesso — inclusive
 * após a etapa de 2FA, quando existir (ver app/admin/page.tsx e
 * app/(private)/page.tsx). Isso grava em localStorage um marcador único,
 * sem nenhuma relação com o token/sessão do backend — é só um "carimbo"
 * de UI. Guardamos também, separadamente, o marcador vigente no momento
 * em que o usuário fechou o Banner, e comparamos os dois:
 *  - mesmo marcador (reload, remontagem, navegação, re-render, nova aba
 *    da mesma sessão) → continua fechado;
 *  - marcador diferente (um login novo aconteceu) → o Banner pode
 *    aparecer de novo, seguindo as regras de negócio já existentes.
 *
 * Usa localStorage (não sessionStorage) de propósito: precisa sobreviver
 * a reload E ser o MESMO em outra aba da mesma sessão (abrir uma nova
 * aba não deveria fazer o Banner reaparecer). Só uma chamada real a
 * `marcarNovoLogin` — ou seja, um login de verdade — troca o valor.
 */

function chaveMarcador(prefixo: string): string {
  return `banner_sessao_login_${prefixo}`;
}

function chaveFechado(prefixo: string): string {
  return `banner_fechado_para_sessao_${prefixo}`;
}

/**
 * Chamado pela tela de login (ver app/admin/page.tsx e
 * app/(private)/page.tsx) no momento em que o login é concluído com
 * sucesso — tanto no fluxo sem 2FA quanto imediatamente após validar o
 * código do 2FA.
 *
 * @param prefixo "admin" ou "private".
 */
export function marcarNovoLogin(prefixo: string): void {
  if (typeof window === "undefined") return;

  const marcador = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(chaveMarcador(prefixo), marcador);
}

export function bannerFoiFechadoNestaSessao(prefixo: string): boolean {
  if (typeof window === "undefined") return false;

  const marcadorAtual = window.localStorage.getItem(chaveMarcador(prefixo));

  // Sem marcador (ex.: cache do navegador foi limpo, ou é a primeira
  // verificação antes de qualquer login passar por esta tela nesta
  // origem) não há o que comparar — trata como "não fechado" em vez de
  // assumir qualquer coisa.
  if (!marcadorAtual) return false;

  return window.localStorage.getItem(chaveFechado(prefixo)) === marcadorAtual;
}

export function marcarBannerFechadoNestaSessao(prefixo: string): void {
  if (typeof window === "undefined") return;

  const marcadorAtual = window.localStorage.getItem(chaveMarcador(prefixo));

  if (!marcadorAtual) return;

  window.localStorage.setItem(chaveFechado(prefixo), marcadorAtual);
}
