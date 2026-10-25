/**
 * O JWT da sessão só pode existir no cookie `httpOnly` (inacessível a JavaScript). Os handlers de
 * login e 2FA do BFF usam esta função para SEPARAR o `token` do restante da resposta do backend:
 * o token vai para o cookie e o navegador recebe somente os demais campos (`2fa_enable`,
 * `temp_token`, dados do usuário...).
 *
 * Atenção: `temp_token` (etapa do 2FA) NÃO é o token da sessão e precisa continuar chegando ao
 * navegador, que o reenvia ao confirmar o código.
 */
export function separarTokenDeSessao(data: unknown): {
  token: string | null;
  dadosPublicos: Record<string, unknown> | null;
} {
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    return { token: null, dadosPublicos: null };
  }

  const { token, ...dadosPublicos } = data as Record<string, unknown>;

  return {
    token: typeof token === "string" && token !== "" ? token : null,
    dadosPublicos,
  };
}
