import { expect, test } from "@playwright/test";

import { CODIGO_2FA, cookieDaSessao, entregarCookieDeSessao, expectSemJwtNoNavegador, preencherLogin, sessaoNoServidor } from "./apoio";

const MARCA_DO_JWT = "assinatura-de-teste"; // trecho presente em todo JWT emitido pelo backend simulado

const areas = [
  { nome: "Admin", login: "/admin", home: "/admin/home", contexto: "admin" as const, api: "/api/auth/admin", usuario: "admin@exemplo.com", usuario2fa: "admin2fa@exemplo.com" },
  { nome: "Private", login: "/", home: "/home", contexto: "private" as const, api: "/api/auth/private", usuario: "cliente@exemplo.com", usuario2fa: "cliente2fa@exemplo.com" },
];

for (const area of areas) {
  test.describe(`Autenticação ${area.nome}`, () => {
    test("login válido: entra na área, grava só um cookie de sessão OPACO e o JWT nunca chega ao navegador", async ({ page, context }) => {
      // SEC-009: nenhuma resposta que o navegador recebe pode conter o JWT
      const corposRecebidos: string[] = [];
      page.on("response", async (r) => {
        if (r.url().startsWith("http://127.0.0.1:3100")) corposRecebidos.push(await r.text().catch(() => ""));
      });

      await preencherLogin(page, area.login, area.usuario);

      const [resposta] = await Promise.all([
        page.waitForResponse((r) => r.url().endsWith(`${area.api}/login`)),
        page.getByRole("button", { name: "Entrar" }).click(),
      ]);

      const corpo = await resposta.text();
      expect(corpo).not.toContain(MARCA_DO_JWT);
      expect(JSON.parse(corpo).data).not.toHaveProperty("token");

      await expect(page).toHaveURL(new RegExp(`${area.home}$`));
      await page.waitForLoadState("networkidle");

      // o navegador guarda só o identificador da sessão: opaco, HttpOnly, Secure, SameSite=Lax, __Host-
      const cookie = await cookieDaSessao(context, area.contexto);
      expect(cookie?.name).toBe(`__Host-${area.contexto}_sid`);
      expect(cookie?.value).toMatch(/^[A-Za-z0-9_-]{43}$/);
      expect(cookie?.value).not.toContain(MARCA_DO_JWT);
      expect(cookie?.httpOnly).toBe(true);
      expect(cookie?.secure).toBe(true);
      expect(cookie?.sameSite).toBe("Lax");
      expect(cookie?.path).toBe("/");
      expect(cookie?.domain).not.toMatch(/^\./); // sem Domain: não vaza para subdomínios

      // o JWT existe, mas SÓ no servidor (Redis), associado a este sid e a este contexto
      const sessao = await sessaoNoServidor(cookie!.value);
      expect(sessao?.contexto).toBe(area.contexto);
      expect(sessao?.token).toContain(MARCA_DO_JWT);

      // nada do que o navegador recebeu (JSON, HTML, scripts) nem o que o JavaScript enxerga tem o JWT
      expect(corposRecebidos.join("\n")).not.toContain(MARCA_DO_JWT);
      expect(await page.content()).not.toContain(MARCA_DO_JWT);
      await expectSemJwtNoNavegador(page);
    });

    test("recarregar a página (F5) mantém a sessão", async ({ page }) => {
      await preencherLogin(page, area.login, area.usuario);
      await page.getByRole("button", { name: "Entrar" }).click();
      await expect(page).toHaveURL(new RegExp(`${area.home}$`));

      await page.reload();

      await expect(page).toHaveURL(new RegExp(`${area.home}$`));
    });

    test("fixação de sessão: um sid escolhido por terceiros é descartado e o login gera outro", async ({ page, context }) => {
      const sidDoInvasor = "A".repeat(43);
      await entregarCookieDeSessao(context, area.contexto, sidDoInvasor);

      await preencherLogin(page, area.login, area.usuario);
      await page.getByRole("button", { name: "Entrar" }).click();
      await expect(page).toHaveURL(new RegExp(`${area.home}$`));

      const cookie = await cookieDaSessao(context, area.contexto);
      expect(cookie?.value).not.toBe(sidDoInvasor);
      expect(await sessaoNoServidor(sidDoInvasor)).toBeNull();
    });

    test("credenciais inválidas: mostra o erro, continua no login e não grava cookie", async ({ page, context }) => {
      await preencherLogin(page, area.login, area.usuario, "SenhaErrada1!");
      await page.getByRole("button", { name: "Entrar" }).click();

      await expect(page.getByText("Credenciais inválidas.")).toBeVisible();
      await expect(page).toHaveURL(new RegExp(`${area.login === "/" ? "/$" : area.login + "$"}`));
      expect(await cookieDaSessao(context, area.contexto)).toBeUndefined();
    });

    test("2FA: o login só entrega o temp_token; a sessão só nasce depois do código correto", async ({ page, context }) => {
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
      expect(await cookieDaSessao(context, area.contexto)).toBeUndefined(); // antes do código: sem sessão

      await page.locator("input[data-input-otp]").fill(CODIGO_2FA);
      const [resposta2fa] = await Promise.all([
        page.waitForResponse((r) => r.url().endsWith(`${area.api}/2fa`)),
        page.getByRole("button", { name: "Validar Código" }).click(),
      ]);

      expect(await resposta2fa.text()).not.toContain(MARCA_DO_JWT);
      await expect(page).toHaveURL(new RegExp(`${area.home}$`));
      expect((await cookieDaSessao(context, area.contexto))?.httpOnly).toBe(true);
      expect(await page.content()).not.toContain(MARCA_DO_JWT);
    });

    test("2FA com código errado: mostra o erro, continua na etapa do código e não cria sessão", async ({ page, context }) => {
      await preencherLogin(page, area.login, area.usuario2fa);
      await page.getByRole("button", { name: "Entrar" }).click();

      await page.locator("input[data-input-otp]").fill("000000");
      await page.getByRole("button", { name: "Validar Código" }).click();

      await expect(page.getByText("Código de verificação inválido.")).toBeVisible();
      await expect(page.getByRole("button", { name: "Validar Código" })).toBeVisible();
      expect(await cookieDaSessao(context, area.contexto)).toBeUndefined();
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
