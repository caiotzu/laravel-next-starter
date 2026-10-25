import { expect, type BrowserContext, type Page } from "@playwright/test";

export const SENHA = "Senha123@";
export const CODIGO_2FA = "123456";

/** JWT sem assinatura válida: o frontend só decodifica o `exp` (a validação real é do backend). */
export function jwtDeTeste(expiraEmSegundos = 3600) {
  const base64 = (obj: object) => Buffer.from(JSON.stringify(obj)).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + expiraEmSegundos;

  return `${base64({ alg: "HS256", typ: "JWT" })}.${base64({ sub: "teste", exp })}.assinatura-de-teste`;
}

export async function definirSessao(context: BrowserContext, cookie: string, expiraEmSegundos = 3600) {
  await context.addCookies([{ name: cookie, value: jwtDeTeste(expiraEmSegundos), url: "http://127.0.0.1:3100" }]);
}

export async function preencherLogin(page: Page, caminho: string, email: string, senha = SENHA) {
  await page.goto(caminho);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(senha);
}

export async function cookieDaSessao(context: BrowserContext, nome: string) {
  return (await context.cookies()).find((c) => c.name === nome);
}

/** O JWT não pode ser lido por JavaScript da página (cookie httpOnly) nem aparecer no corpo das respostas. */
export async function expectSemJwtNoNavegador(page: Page) {
  expect(await page.evaluate(() => document.cookie)).not.toContain("access_token");
}
