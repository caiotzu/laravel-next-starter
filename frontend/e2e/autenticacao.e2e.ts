import { expect, test } from "@playwright/test";

import { CODIGO_2FA, cookieDaSessao, expectSemJwtNoNavegador, preencherLogin } from "./apoio";

const MARCA_DO_JWT = "assinatura-de-teste"; // trecho presente em todo JWT emitido pelo backend simulado

const areas = [
  { nome: "Admin", login: "/admin", home: "/admin/home", cookie: "admin_access_token", api: "/api/auth/admin", usuario: "admin@exemplo.com", usuario2fa: "admin2fa@exemplo.com" },
  { nome: "Private", login: "/", home: "/home", cookie: "private_access_token", api: "/api/auth/private", usuario: "cliente@exemplo.com", usuario2fa: "cliente2fa@exemplo.com" },
];

for (const area of areas) {
  test.describe(`Autenticação ${area.nome}`, () => {
    test("login válido: entra na área, grava o cookie httpOnly e NÃO entrega o JWT ao navegador", async ({ page, context }) => {
      await preencherLogin(page, area.login, area.usuario);

      const [resposta] = await Promise.all([
        page.waitForResponse((r) => r.url().endsWith(`${area.api}/login`)),
        page.getByRole("button", { name: "Entrar" }).click(),
      ]);

      // SEC-007: o corpo da resposta não contém o token da sessão
      const corpo = await resposta.text();
      expect(corpo).not.toContain(MARCA_DO_JWT);
      expect(JSON.parse(corpo).data).not.toHaveProperty("token");

      await expect(page).toHaveURL(new RegExp(`${area.home}$`));

      const cookie = await cookieDaSessao(context, area.cookie);
      expect(cookie?.value).toContain(MARCA_DO_JWT);
      expect(cookie?.httpOnly).toBe(true);
      expect(cookie?.sameSite).toBe("Lax");
      await expectSemJwtNoNavegador(page);
    });

    test("credenciais inválidas: mostra o erro, continua no login e não grava cookie", async ({ page, context }) => {
      await preencherLogin(page, area.login, area.usuario, "SenhaErrada1!");
      await page.getByRole("button", { name: "Entrar" }).click();

      await expect(page.getByText("Credenciais inválidas.")).toBeVisible();
      await expect(page).toHaveURL(new RegExp(`${area.login === "/" ? "/$" : area.login + "$"}`));
      expect(await cookieDaSessao(context, area.cookie)).toBeUndefined();
    });

    test("2FA: o login só entrega o temp_token; o cookie só nasce depois do código correto", async ({ page, context }) => {
      await preencherLogin(page, area.login, area.usuario2fa);

      const [respostaLogin] = await Promise.all([
        page.waitForResponse((r) => r.url().endsWith(`${area.api}/login`)),
        page.getByRole("button", { name: "Entrar" }).click(),
      ]);
      const login = await respostaLogin.json();

      expect(login.data["2fa_enable"]).toBe(true);
      expect(login.data.temp_token).toBeTruthy();
      expect(JSON.stringify(login)).not.toContain(MARCA_DO_JWT);

      await expect(page.getByRole("button", { name: "Validar Código" })).toBeVisible();
      expect(await cookieDaSessao(context, area.cookie)).toBeUndefined(); // antes do código: sem sessão

      await page.locator("input[data-input-otp]").fill(CODIGO_2FA);
      const [resposta2fa] = await Promise.all([
        page.waitForResponse((r) => r.url().endsWith(`${area.api}/2fa`)),
        page.getByRole("button", { name: "Validar Código" }).click(),
      ]);

      expect(await resposta2fa.text()).not.toContain(MARCA_DO_JWT);
      await expect(page).toHaveURL(new RegExp(`${area.home}$`));
      expect((await cookieDaSessao(context, area.cookie))?.httpOnly).toBe(true);
    });

    test("2FA com código errado: mostra o erro, continua na etapa do código e não cria sessão", async ({ page, context }) => {
      await preencherLogin(page, area.login, area.usuario2fa);
      await page.getByRole("button", { name: "Entrar" }).click();

      await page.locator("input[data-input-otp]").fill("000000");
      await page.getByRole("button", { name: "Validar Código" }).click();

      await expect(page.getByText("Código de verificação inválido.")).toBeVisible();
      await expect(page.getByRole("button", { name: "Validar Código" })).toBeVisible();
      expect(await cookieDaSessao(context, area.cookie)).toBeUndefined();
    });
  });
}

test("o login Private não aceita um usuário Admin (e vice-versa)", async ({ page }) => {
  await preencherLogin(page, "/", "admin@exemplo.com");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("Credenciais inválidas.")).toBeVisible();

  await preencherLogin(page, "/admin", "cliente@exemplo.com");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("Credenciais inválidas.")).toBeVisible();
});
