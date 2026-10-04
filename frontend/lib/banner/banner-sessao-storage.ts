/**
 * Controle de "o Banner deve ser exibido agora?" — usado pelos dois
 * BannerProvider (Admin e Private).
 *
 * Regra: o Banner aparece EXCLUSIVAMENTE logo após um login concluído
 * (inclusive após a etapa de 2FA) e em nenhum outro momento — nem ao trocar
 * de menu, nem ao navegar, nem ao recarregar a página.
 *
 * Como funciona: a tela de login chama `marcarNovoLogin` no instante em que o
 * login se completa. Isso "arma" um sinal de uso único (sessionStorage, por
 * aba — o redirecionamento do login acontece na mesma aba). O BannerProvider
 * lê o sinal, busca os banners e o CONSOME na mesma hora
 * (`consumirBannerPendente`). Sem sinal armado, nada é buscado nem exibido.
 * Não depende de rota, de token nem de estado em memória.
 */

function chavePendente(prefixo: string): string {
  return `banner_pendente_${prefixo}`;
}

function storage(): Storage | null {
  if (typeof window === "undefined") return null;

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** Chamado pela tela de login quando o login é concluído com sucesso. */
export function marcarNovoLogin(prefixo: string): void {
  try {
    storage()?.setItem(chavePendente(prefixo), "1");
  } catch {
    // Storage indisponível: o Banner simplesmente não é exibido.
  }
}

/** Há um login recém-concluído cujo Banner ainda não foi tratado? */
export function existeBannerPendente(prefixo: string): boolean {
  try {
    return storage()?.getItem(chavePendente(prefixo)) === "1";
  } catch {
    return false;
  }
}

/** Gasta o sinal: a partir daqui o Banner não volta até o próximo login. */
export function consumirBannerPendente(prefixo: string): void {
  try {
    storage()?.removeItem(chavePendente(prefixo));
  } catch {
    // ignora
  }
}
