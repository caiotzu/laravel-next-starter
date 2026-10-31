import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import jwt from "jsonwebtoken";

import { nomeCookieSessao, opcoesCookieSessao } from "./cookie";
import { sidTemFormatoValido } from "./sid";
import { getSessionStore } from "./store";
import { type ContextoSessao, SessaoIndisponivelError } from "./tipos";

/** Padrão quando o JWT não traz `exp`. */
const TTL_PADRAO_SEGUNDOS = 60 * 60;
/** Teto: mesmo que o backend emita um token longo, a sessão do BFF não passa disso. */
const TTL_MAXIMO_SEGUNDOS = 12 * 60 * 60;

/**
 * Tempo de vida da sessão = tempo restante do JWT. A sessão do BFF nunca dura mais que o token que
 * ela guarda. Só lê o `exp` (não verifica assinatura: quem valida o JWT é o backend).
 */
export function calcularTtlDaSessao(token: string, agora: number = Math.floor(Date.now() / 1000)): number {
  const exp = (jwt.decode(token) as { exp?: unknown } | null)?.exp;

  if (typeof exp !== "number") return TTL_PADRAO_SEGUNDOS;

  return Math.min(Math.max(Math.floor(exp - agora), 1), TTL_MAXIMO_SEGUNDOS);
}

/**
 * Cria a sessão após um login bem-sucedido e grava o cookie opaco. Se o navegador já tinha uma
 * sessão deste contexto, ela é DESTRUÍDA antes (evita fixação de sessão e sessão órfã no Redis).
 */
export async function iniciarSessao(contexto: ContextoSessao, token: string): Promise<void> {
  const cookieStore = await cookies();
  const nome = nomeCookieSessao(contexto);
  const store = getSessionStore();

  const anterior = cookieStore.get(nome)?.value;

  if (sidTemFormatoValido(anterior)) {
    await store.destruir(anterior).catch(() => undefined);
  }

  const ttl = calcularTtlDaSessao(token);
  const sid = await store.criar({ contexto, token }, ttl);

  cookieStore.set(nome, sid, opcoesCookieSessao(ttl));
}

/**
 * JWT da sessão atual, ou `null` se não há cookie, o `sid` é inválido/expirado ou a sessão é de
 * outro contexto. Lança `SessaoIndisponivelError` se o Redis estiver fora do ar.
 */
export async function obterTokenDaSessao(contexto: ContextoSessao): Promise<string | null> {
  const cookieStore = await cookies();
  const sid = cookieStore.get(nomeCookieSessao(contexto))?.value;

  if (!sidTemFormatoValido(sid)) return null;

  const sessao = await getSessionStore().obter(sid);

  return sessao && sessao.contexto === contexto ? sessao.token : null;
}

/**
 * Encerra a sessão: remove do Redis (se existir) e apaga o cookie. O cookie é apagado MESMO que o
 * Redis falhe: o navegador deixa de apresentar a sessão, e o registro some sozinho pelo TTL.
 */
export async function encerrarSessao(contexto: ContextoSessao): Promise<void> {
  const cookieStore = await cookies();
  const nome = nomeCookieSessao(contexto);
  const sid = cookieStore.get(nome)?.value;

  if (sidTemFormatoValido(sid)) {
    await getSessionStore().destruir(sid).catch(() => undefined);
  }

  cookieStore.set(nome, "", opcoesCookieSessao(0));
}

export function respostaSessaoIndisponivel(): NextResponse {
  return NextResponse.json(
    { errors: { business: ["Serviço de sessão temporariamente indisponível. Tente novamente em instantes."] } },
    { status: 503 }
  );
}

export function respostaSessaoExpirada(): NextResponse {
  return NextResponse.json(
    { errors: { business: ["Sessão inválida ou expirada."] }, tokenExpired: true },
    { status: 401 }
  );
}

export { SessaoIndisponivelError };
