import { expect, type BrowserContext, type Page } from "@playwright/test";
import Redis from "ioredis";

import { RedisSessionStore } from "../lib/session/redis-store";

export const SENHA = "Senha123@";
export const CODIGO_2FA = "123456";

export type Contexto = "admin" | "private";

/** Mesmo Redis que o app usa (ver `playwright.config.ts`). */
export const URL_REDIS = process.env.REDIS_URL ?? "redis://127.0.0.1:6390";

/**
 * O app roda em PRODUÇÃO (`next start`), então o cookie leva o prefixo `__Host-`. Se for usado um
 * `next dev` (que não usa o prefixo), defina `E2E_COOKIE_PREFIX=""`.
 */
export function nomeDoCookie(contexto: Contexto) {
  return `${process.env.E2E_COOKIE_PREFIX ?? "__Host-"}${contexto}_sid`;
}

let redisDoTeste: Redis | null = null;

function redis() {
  redisDoTeste ??= new Redis(URL_REDIS, { maxRetriesPerRequest: 2 });

  return redisDoTeste;
}

export async function fecharRedisDoTeste() {
  await redisDoTeste?.quit().catch(() => undefined);
  redisDoTeste = null;
}

/** Sessão guardada no Redis para um sid (o que SÓ o servidor enxerga). */
export async function sessaoNoServidor(sid: string) {
  const bruto = await redis().get(`bff:sess:${sid}`);

  return bruto ? (JSON.parse(bruto) as { contexto: Contexto; token: string; expiraEm: number }) : null;
}

/** JWT sem assinatura válida: o BFF só lê o `exp` (a validação real é do backend). */
export function jwtDeTeste(expiraEmSegundos = 3600) {
  const base64 = (obj: object) => Buffer.from(JSON.stringify(obj)).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + expiraEmSegundos;

  return `${base64({ alg: "HS256", typ: "JWT" })}.${base64({ sub: "teste", exp })}.assinatura-de-teste`;
}

/**
 * Cria uma sessão no Redis (como um login faria) e entrega o cookie opaco ao navegador.
 * `expiraEmSegundos <= 0` grava uma sessão JÁ VENCIDA (a chave existe, mas `expiraEm` passou).
 */
export async function definirSessao(context: BrowserContext, contexto: Contexto, expiraEmSegundos = 3600) {
  let sid: string;

  if (expiraEmSegundos > 0) {
    sid = await new RedisSessionStore(redis()).criar({ contexto, token: jwtDeTeste(expiraEmSegundos) }, expiraEmSegundos);
  } else {
    sid = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url");
    const agora = Math.floor(Date.now() / 1000);
    await redis().set(
      `bff:sess:${sid}`,
      JSON.stringify({ contexto, token: jwtDeTeste(expiraEmSegundos), criadaEm: agora - 3600, expiraEm: agora + expiraEmSegundos }),
      "EX",
      60
    );
  }

  await entregarCookieDeSessao(context, contexto, sid);

  return sid;
}

/**
 * Coloca o cookie de sessão no navegador. `domain` + `path` explícitos (e não `url`): o prefixo
 * `__Host-` exige `Secure`, `Path=/` e ausência de `Domain` de ATRIBUTO, e o Playwright só aceita
 * essa combinação assim.
 */
export async function entregarCookieDeSessao(context: BrowserContext, contexto: Contexto, valor: string) {
  await context.addCookies([
    { name: nomeDoCookie(contexto), value: valor, domain: "127.0.0.1", path: "/", httpOnly: true, secure: true, sameSite: "Lax" },
  ]);
}

export async function preencherLogin(page: Page, caminho: string, email: string, senha = SENHA) {
  await page.goto(caminho);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(senha);
}

export async function cookieDaSessao(context: BrowserContext, contexto: Contexto) {
  return (await context.cookies()).find((c) => c.name === nomeDoCookie(contexto));
}

/** Nenhum JWT acessível ao JavaScript da página: `document.cookie`, localStorage e sessionStorage. */
export async function expectSemJwtNoNavegador(page: Page) {
  const { cookie, local, sessao } = await page.evaluate(() => ({
    cookie: document.cookie,
    local: JSON.stringify({ ...localStorage }),
    sessao: JSON.stringify({ ...sessionStorage }),
  }));

  expect(cookie).toBe(""); // o cookie de sessão é HttpOnly: invisível ao JavaScript
  for (const armazenado of [cookie, local, sessao]) {
    expect(armazenado).not.toContain("assinatura-de-teste");
    expect(armazenado).not.toMatch(/eyJ[A-Za-z0-9_-]{10,}\./); // forma de qualquer JWT
  }
}

/** Requisições registradas pelo backend simulado (o que o BFF realmente enviou). */
export async function requisicoesDoBackend(): Promise<{ metodo: string; caminho: string; autorizacao: string | null }[]> {
  const resposta = await fetch("http://127.0.0.1:4010/__requests");

  return resposta.json();
}

/** `sub` do JWT enviado ao backend: identifica QUEM o BFF representou na chamada. */
export function usuarioDoToken(autorizacao: string | null): string | null {
  const jwt = autorizacao?.replace(/^Bearer /, "");
  const payload = jwt?.split(".")[1];

  return payload ? (JSON.parse(Buffer.from(payload, "base64url").toString()).sub ?? null) : null;
}
