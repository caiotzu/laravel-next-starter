/**
 * SEC-009 + vários usuários: cada pessoa (cada computador) tem a SUA sessão, o BFF representa
 * cada uma com o PRÓPRIO token e nenhuma interfere na outra. Cada `browser.newContext()` é um
 * computador diferente (cookies separados); o backend simulado registra o `Authorization`
 * recebido, então dá para provar QUEM o BFF representou em cada chamada.
 */
import { expect, test, type Browser, type BrowserContext } from "@playwright/test";

import { cookieDaSessao, definirSessao, entregarCookieDeSessao, nomeDoCookie, preencherLogin, requisicoesDoBackend, sessaoNoServidor, usuarioDoToken } from "./apoio";

const ORIGEM = "http://127.0.0.1:3100";

async function entrar(browser: Browser, area: "admin" | "private", email: string) {
  const context = await browser.newContext();
  const page = await context.newPage();

  await preencherLogin(page, area === "admin" ? "/admin" : "/", email);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(new RegExp(area === "admin" ? "/admin/home$" : "/home$"));

  return { context, page, sid: (await cookieDaSessao(context, area))!.value };
}

/** Chamada autenticada pelo proxy do BFF, como o front faz (com um caminho único para rastrear). */
async function chamarProxy(context: BrowserContext, area: "admin" | "private", rota: string) {
  const resposta = await context.request.post(`${ORIGEM}/api/proxy/${area}`, {
    headers: { origin: ORIGEM, "content-type": "application/json" },
    data: { url: rota, method: "GET" },
  });

  return resposta;
}

test.beforeEach(async () => {
  await fetch("http://127.0.0.1:4010/__requests", { method: "DELETE" });
});

test.describe("Vários usuários ao mesmo tempo", () => {
  test("dois usuários Admin em computadores diferentes: cada um é representado pelo PRÓPRIO token", async ({ browser }) => {
    const [maria, joao] = await Promise.all([
      entrar(browser, "admin", "admin@exemplo.com"),
      entrar(browser, "admin", "admin.b@exemplo.com"),
    ]);

    expect(maria.sid).not.toBe(joao.sid);

    const [r1, r2] = await Promise.all([
      chamarProxy(maria.context, "admin", "/admin/marca-maria"),
      chamarProxy(joao.context, "admin", "/admin/marca-joao"),
    ]);
    expect(r1.status()).toBe(200);
    expect(r2.status()).toBe(200);

    const chamadas = await requisicoesDoBackend();
    const daMaria = chamadas.find((c) => c.caminho === "/api/admin/marca-maria");
    const doJoao = chamadas.find((c) => c.caminho === "/api/admin/marca-joao");

    expect(usuarioDoToken(daMaria!.autorizacao)).toBe("admin@exemplo.com");
    expect(usuarioDoToken(doJoao!.autorizacao)).toBe("admin.b@exemplo.com");

    await Promise.all([maria.context.close(), joao.context.close()]);
  });

  test("o logout de um usuário NÃO derruba o outro", async ({ browser }) => {
    const [maria, joao] = await Promise.all([
      entrar(browser, "admin", "admin@exemplo.com"),
      entrar(browser, "admin", "admin.b@exemplo.com"),
    ]);

    await maria.page.getByRole("button", { name: /m@example\.com/ }).click();
    await maria.page.getByRole("menuitem", { name: "Sair" }).click();
    await expect(maria.page).toHaveURL(/\/admin(\?.*)?$/);

    expect(await sessaoNoServidor(maria.sid)).toBeNull();
    expect(await sessaoNoServidor(joao.sid)).not.toBeNull();

    expect((await chamarProxy(maria.context, "admin", "/admin/depois-do-logout")).status()).toBe(401);
    expect((await chamarProxy(joao.context, "admin", "/admin/continua-logado")).status()).toBe(200);

    await joao.page.reload();
    await expect(joao.page).toHaveURL(/\/admin\/home$/);

    await Promise.all([maria.context.close(), joao.context.close()]);
  });

  test("o MESMO usuário em casa e no trabalho: duas sessões independentes", async ({ browser }) => {
    const [casa, trabalho] = await Promise.all([
      entrar(browser, "private", "cliente@exemplo.com"),
      entrar(browser, "private", "cliente@exemplo.com"),
    ]);

    expect(casa.sid).not.toBe(trabalho.sid);
    expect((await sessaoNoServidor(casa.sid))?.token).not.toBe((await sessaoNoServidor(trabalho.sid))?.token);

    // sair em casa não desloga o computador do trabalho
    await casa.page.getByRole("button", { name: /m@example\.com/ }).click();
    await casa.page.getByRole("menuitem", { name: "Sair" }).click();
    await expect(casa.page).toHaveURL(/\/(\?.*)?$/);

    expect(await sessaoNoServidor(casa.sid)).toBeNull();
    expect((await chamarProxy(trabalho.context, "private", "/marca-trabalho")).status()).toBe(200);

    await Promise.all([casa.context.close(), trabalho.context.close()]);
  });

  test("Admin e Private no mesmo computador têm sessões separadas; sair de uma não encerra a outra", async ({ browser }) => {
    const context = await browser.newContext();
    const admin = await definirSessao(context, "admin");
    const priv = await definirSessao(context, "private");
    const page = await context.newPage();

    await page.goto("/admin/home");
    await expect(page).toHaveURL(/\/admin\/home$/);
    await page.goto("/home");
    await expect(page).toHaveURL(/\/home$/);

    await page.getByRole("button", { name: /m@example\.com/ }).click();
    await page.getByRole("menuitem", { name: "Sair" }).click();

    expect(await sessaoNoServidor(priv)).toBeNull();
    expect(await sessaoNoServidor(admin)).not.toBeNull();

    await context.close();
  });

  test("20 logins simultâneos (20 computadores): 20 sessões distintas, cada uma com o seu token", async ({ playwright }) => {
    const usuarios = Array.from({ length: 20 }, (_, i) => (i % 2 ? "admin.b@exemplo.com" : "admin@exemplo.com"));

    const computadores = await Promise.all(
      usuarios.map(async (email) => {
        const api = await playwright.request.newContext({ baseURL: ORIGEM, extraHTTPHeaders: { origin: ORIGEM } });
        const resposta = await api.post("/api/auth/admin/login", { data: { email, senha: "Senha123@" } });
        expect(resposta.status()).toBe(200);

        const cookie = (await api.storageState()).cookies.find((c) => c.name === nomeDoCookie("admin"))!;

        return { api, email, sid: cookie.value };
      })
    );

    expect(new Set(computadores.map((c) => c.sid)).size).toBe(20);

    // cada computador chama o backend ao mesmo tempo, com uma rota que só ele conhece
    await Promise.all(
      computadores.map(async (c, i) => {
        const r = await c.api.post("/api/proxy/admin", { data: { url: `/admin/rastro-${i}`, method: "GET" } });
        expect(r.status()).toBe(200);
      })
    );

    const chamadas = await requisicoesDoBackend();

    computadores.forEach((c, i) => {
      const chamada = chamadas.find((x) => x.caminho === `/api/admin/rastro-${i}`);
      expect(usuarioDoToken(chamada!.autorizacao), `computador ${i}`).toBe(c.email);
    });

    // dois computadores do MESMO usuário nunca compartilham token
    const tokens = await Promise.all(computadores.map(async (c) => (await sessaoNoServidor(c.sid))!.token));
    expect(new Set(tokens).size).toBe(20);

    await Promise.all(computadores.map((c) => c.api.dispose()));
  });
});

test.describe("Cookie adulterado ou forjado", () => {
  const rotas = [
    { area: "admin" as const, home: "/admin/home", login: /\/admin$/ },
    { area: "private" as const, home: "/home", login: /\/(\?.*)?$/ },
  ];

  for (const { area, home, login } of rotas) {
    test(`${area}: sid inexistente, JWT no lugar do sid e lixo são recusados`, async ({ page, context }) => {
      const forjados = [
        "B".repeat(43), // formato certo, mas não existe
        "eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.assinatura-de-teste", // um JWT no lugar do sid
        "../../bff:sess:outra-chave",
      ];

      for (const valor of forjados) {
        await context.clearCookies();
        await entregarCookieDeSessao(context, area, valor);

        await page.goto(home);
        await expect(page, valor).toHaveURL(login);
        expect((await chamarProxy(context, area, area === "admin" ? "/admin/x" : "/x")).status(), valor).toBe(401);
      }
    });

    test(`${area}: sessão vencida no servidor é recusada na página e no proxy`, async ({ page, context }) => {
      await definirSessao(context, area, -60);

      await page.goto(home);
      await expect(page).toHaveURL(login);
      expect((await chamarProxy(context, area, area === "admin" ? "/admin/x" : "/x")).status()).toBe(401);
    });
  }

  test("a sessão Private apresentada no cookie Admin (e vice-versa) não abre a outra área", async ({ page, context }) => {
    const sidPrivate = await definirSessao(context, "private");
    await context.clearCookies();
    await entregarCookieDeSessao(context, "admin", sidPrivate);

    await page.goto("/admin/home");
    await expect(page).toHaveURL(/\/admin$/);
    expect((await chamarProxy(context, "admin", "/admin/x")).status()).toBe(401);
  });

  test("sem sessão, o proxy recusa e NADA chega ao backend", async ({ request }) => {
    const resposta = await request.post(`${ORIGEM}/api/proxy/admin`, {
      headers: { origin: ORIGEM, "content-type": "application/json" },
      data: { url: "/admin/sem-sessao", method: "GET" },
    });

    expect(resposta.status()).toBe(401);
    const chamadas = await requisicoesDoBackend();
    expect(chamadas.some((c) => c.caminho === "/api/admin/sem-sessao")).toBe(false);
  });
});
