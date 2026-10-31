import { getSessionStore } from "./store";
import type { ContextoSessao } from "./tipos";

/**
 * Usado pelo `proxy.ts` (redirecionamento de rotas). Fecha em caso de dúvida: Redis fora do ar,
 * `sid` malformado, sessão de outro contexto ou expirada → "não autenticado".
 */
export async function sessaoEhValida(contexto: ContextoSessao, sid: string | undefined): Promise<boolean> {
  if (!sid) return false;

  try {
    const sessao = await getSessionStore().obter(sid);

    return sessao?.contexto === contexto;
  } catch {
    return false;
  }
}
