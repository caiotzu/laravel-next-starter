import type { ContextoSessao } from "./tipos";

const producao = () => process.env.NODE_ENV === "production";

/**
 * Nome do cookie de sessão. Um por contexto: o Admin e o Private continuam isolados, e o Admin em
 * "acesso de suporte" pode ter as duas sessões abertas no mesmo navegador.
 *
 * Em produção usa o prefixo `__Host-`: o navegador só aceita o cookie se ele for `Secure`, com
 * `Path=/` e SEM `Domain` (não vaza para subdomínios). Em desenvolvimento (http) o prefixo seria
 * rejeitado, então só ele muda; os demais atributos de produção não são enfraquecidos.
 */
export function nomeCookieSessao(contexto: ContextoSessao): string {
  const base = `${contexto}_sid`;

  return producao() ? `__Host-${base}` : base;
}

export function opcoesCookieSessao(maxAgeSegundos: number) {
  return {
    httpOnly: true,
    secure: producao(),
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSegundos,
  };
}
