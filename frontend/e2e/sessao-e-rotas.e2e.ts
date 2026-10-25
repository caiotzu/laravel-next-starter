import { expect, test } from "@playwright/test";

import { cookieDaSessao, definirSessao, preencherLogin } from "./apoio";

const areas = [
  { nome: "Admin", login: "/admin", home: "/admin/home", protegidas: ["/admin/home", "/admin/usuarios", "/admin/grupos"], cookie: "admin_access_token", usuario: "admin@exemplo.com", publicas: ["/admin/esqueceu-senha", "/admin/primeiro-acesso", "/admin/redefinir-senha"] },
  { nome: "Private", login: "/", home: "/home", protegidas: ["/home", "/usuarios", "/grupos"], cookie: "private_access_token", usuario: "cliente@exemplo.com", publicas: ["/esqueceu-senha", "/primeiro-acesso", "/redefinir-senha"] },
];

const urlDoLogin = (login: string) => new RegExp(login === "/" ? "/(\\?.*)?$" : `${login}(\\?.*)?$`);

for (const area of areas) {
  test.describe(`Sessão e rotas ${area.nome}`, () => {
    for (const rota of area.protegidas) {
      test(`sem sessão, ${rota} redireciona para o login`, async ({ page }) => {
        await page.goto(rota);

        await expect(page).toHaveURL(urlDoLogin(area.login));
        await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
      });
    }

    test("com a sessão expirada, a rota protegida volta para o login", async ({ page, context }) => {
      await definirSessao(context, area.cookie, -60); // expirou há 1 minuto

      await page.goto(area.home);

      await expect(page).toHaveURL(urlDoLogin(area.login));
    });

    test("com a sessão válida, a tela de login leva direto para a home", async ({ page, context }) => {
      await definirSessao(context, area.cookie);

      await page.goto(area.login);

      await expect(page).toHaveURL(new RegExp(`${area.home}$`));
    });

    test("as telas de recuperação de senha e primeiro acesso são públicas", async ({ page }) => {
      for (const rota of area.publicas) {
        const resposta = await page.goto(rota);

        expect(resposta?.status(), rota).toBe(200);
        expect(new URL(page.url()).pathname, rota).toBe(rota);
      }
    });

    test("logout: o item Sair encerra a sessão, remove o cookie e bloqueia as rotas protegidas", async ({ page, context }) => {
      await preencherLogin(page, area.login, area.usuario);
      await page.getByRole("button", { name: "Entrar" }).click();
      await expect(page).toHaveURL(new RegExp(`${area.home}$`));
      expect(await cookieDaSessao(context, area.cookie)).toBeDefined();

      await page.getByRole("button", { name: /m@example\.com/ }).click();
      await page.getByRole("menuitem", { name: "Sair" }).click();

      await expect(page).toHaveURL(urlDoLogin(area.login));
      expect(await cookieDaSessao(context, area.cookie)).toBeUndefined();

      await page.goto(area.home);
      await expect(page).toHaveURL(urlDoLogin(area.login));
    });
  });
}

test("a sessão de uma área não vale na outra (cookies separados Admin x Private)", async ({ page, context }) => {
  await definirSessao(context, "private_access_token");

  await page.goto("/admin/home");

  await expect(page).toHaveURL(/\/admin$/);
});

test("as respostas trazem os cabeçalhos de segurança", async ({ request }) => {
  const resposta = await request.get("/admin");
  const cabecalhos = resposta.headers();

  expect(cabecalhos["x-frame-options"]).toBe("DENY");
  expect(cabecalhos["x-content-type-options"]).toBe("nosniff");
  expect(cabecalhos["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(cabecalhos["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(cabecalhos["permissions-policy"]).toContain("camera=()");
  expect(cabecalhos["x-powered-by"]).toBeUndefined(); // não revela a tecnologia do servidor
});

test("o proxy do BFF recusa requisição de outra origem (CSRF) sem chamar o backend", async ({ request }) => {
  const resposta = await request.post("/api/auth/admin/login", {
    headers: { origin: "https://site-malicioso.example", "content-type": "application/json" },
    data: { email: "admin@exemplo.com", senha: "Senha123@" },
  });

  expect(resposta.status()).toBe(403);
  expect(await resposta.text()).not.toContain("assinatura-de-teste");
});
