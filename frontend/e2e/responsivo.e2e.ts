/**
 * FRONT-007 / FRONT-008 / FRONT-009: em tela de celular (375 px) a página NÃO pode ganhar rolagem
 * horizontal, a paginação precisa caber no cartão e as abas do cadastro de empresa precisam caber
 * na linha. As respostas do backend são interceptadas no proxy do BFF (`/api/proxy/admin`), então o
 * backend simulado não precisa conhecer essas telas.
 */
import { expect, test, type Page } from "@playwright/test";

import { definirSessao } from "./apoio";

test.use({ viewport: { width: 375, height: 812 } });

const PERMISSOES = [
  "admin.mensagem.listar",
  "admin.mensagem.cadastrar",
  "admin.empresa.listar",
  "admin.empresa.cadastrar",
];

const usuario = {
  id: "u1",
  nome: "Administrador de Teste",
  email: "admin@exemplo.com",
  avatar: null,
  grupo: "Admin",
  status: "ativo",
  google2fa_enable: false,
  permissoes: PERMISSOES,
};

function mensagens(quantidade: number) {
  return Array.from({ length: quantidade }, (_, i) => ({
    id: `m${i}`,
    titulo: `Mensagem de teste com um título bem comprido número ${i + 1}`,
    conteudo: "conteúdo",
    origem: i % 2 ? "sistema" : "admin",
    remetente: null,
    direcionamento: { tipo: "grupo_empresa", entidade_tipo: null, grupo_empresa_id: "g1", grupo_empresa_nome: "Grupo de Empresas com Nome Extenso", usuario_id: null, usuario_nome: null },
    total_destinatarios: 10,
    total_lidos: 3,
    created_at: "2026-10-20T12:00:00.000000Z",
    updated_at: null,
    deleted_at: null,
  }));
}

async function simularBackend(page: Page) {
  await page.route("**/api/proxy/admin", async (route) => {
    const { url } = route.request().postDataJSON() as { url: string };

    let corpo: unknown = { data: [] };

    if (url === "/admin/me") {
      corpo = { data: usuario };
    } else if (url.startsWith("/admin/mensagens")) {
      corpo = {
        data: mensagens(10),
        meta: { current_page: 10, last_page: 20, per_page: 10, total: 200, from: 91, to: 100 },
      };
    }

    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: 200, data: corpo }) });
  });
}

/** Rolagem horizontal da PÁGINA (a de uma tabela dentro do seu cartão é permitida). */
async function larguraExcedente(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

test.describe("Telas em 375 px", () => {
  test.beforeEach(async ({ context, page }) => {
    await definirSessao(context, "admin_access_token");
    await simularBackend(page);
  });

  test("mensagens: a página não ganha rolagem horizontal e a paginação cabe no cartão", async ({ page }) => {
    await page.goto("/admin/mensagens");

    const paginacao = page.getByRole("button", { name: "Próximo" });
    await expect(paginacao).toBeVisible();

    expect(await larguraExcedente(page)).toBeLessThanOrEqual(0);

    const cartao = page.locator('[data-slot="card"]', { has: paginacao });
    const caixaCartao = (await cartao.boundingBox())!;
    expect(caixaCartao.x).toBeGreaterThanOrEqual(0);
    expect(caixaCartao.x + caixaCartao.width).toBeLessThanOrEqual(375);

    // todo botão da paginação (Anterior, números, Próximo) fica dentro do cartão
    const botoes = cartao.getByRole("button");
    const total = await botoes.count();
    expect(total).toBeGreaterThanOrEqual(7); // Anterior + 5 números + Próximo (as reticências não são botões)

    for (let i = 0; i < total; i++) {
      const caixa = (await botoes.nth(i).boundingBox())!;
      expect(caixa.x, `botão ${i}`).toBeGreaterThanOrEqual(caixaCartao.x);
      expect(caixa.x + caixa.width, `botão ${i}`).toBeLessThanOrEqual(caixaCartao.x + caixaCartao.width);
    }
  });

  test("cadastro de empresa: as três abas cabem na linha e a página não rola na horizontal", async ({ page }) => {
    await page.goto("/admin/empresas/cadastrar");

    const abas = page.getByRole("tab");
    await expect(abas).toHaveCount(3);

    const lista = page.getByRole("tablist");
    const caixaLista = (await lista.boundingBox())!;

    for (let i = 0; i < 3; i++) {
      const caixa = (await abas.nth(i).boundingBox())!;
      expect(caixa.x, `aba ${i}`).toBeGreaterThanOrEqual(caixaLista.x);
      expect(caixa.x + caixa.width, `aba ${i}`).toBeLessThanOrEqual(caixaLista.x + caixaLista.width + 1);
    }

    expect(await lista.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(0);
    expect(await larguraExcedente(page)).toBeLessThanOrEqual(0);
  });
});
