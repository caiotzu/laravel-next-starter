/**
 * SEC-009: o proxy autenticado (/api/proxy/{admin,private}) resolve o JWT pela SESSÃO no servidor.
 * Sem sessão válida nada é encaminhado; o navegador nunca escolhe o token, o destino nem o contexto.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const axiosRequest = vi.hoisted(() => vi.fn());

vi.mock("next/headers", async () => ({ cookies: (await import("../helpers/cookies")).cookiesFalsos }));
vi.mock("axios", () => ({ default: { request: axiosRequest } }));
vi.mock("@/lib/session/store", async () => {
  const { harness } = await import("../helpers/sessao");

  return { getSessionStore: () => harness.store };
});

import { POST as proxyAdmin } from "@/app/api/proxy/admin/route";
import { POST as proxyPrivate } from "@/app/api/proxy/private/route";

import { comoNavegador, JarDeCookies } from "../helpers/cookies";
import { harness, reiniciarSessoes, sessaoDeTeste } from "../helpers/sessao";

const SUPORTE = "7f9c24e8-3b12-4e8a-9d11-0c8d5a1b2f33";

function requisicao(corpo: unknown, origem: string | null = "http://localhost:3000") {
  const headers: Record<string, string> = { "content-type": "application/json", "user-agent": "vitest" };
  if (origem) headers.origin = origem;

  return new Request("http://localhost:3000/api/proxy/x", { method: "POST", headers, body: JSON.stringify(corpo) });
}

const casos = [
  { nome: "admin", POST: proxyAdmin, contexto: "admin", outro: "private", url: "/admin/usuarios" },
  { nome: "private", POST: proxyPrivate, contexto: "private", outro: "admin", url: "/usuarios" },
] as const;

beforeEach(() => {
  axiosRequest.mockReset().mockResolvedValue({ status: 200, data: { data: [{ id: 1 }] } });
  reiniciarSessoes();
  vi.stubEnv("BACKEND_URL", "http://backend/api");
  vi.stubEnv("FRONTEND_URL", "http://localhost:3000");
});

describe.each(casos)("proxy $nome — sessão", ({ POST, contexto, outro, url }) => {
  it("com sessão válida chama o backend com o JWT DA SESSÃO e nunca devolve o token ao navegador", async () => {
    const { sid } = await sessaoDeTeste(contexto, "jwt-do-servidor");
    const jar = new JarDeCookies({ [`${contexto}_sid`]: sid });

    const resposta = await comoNavegador(jar, () => POST(requisicao({ url, method: "GET" })));
    const texto = await resposta.text();

    expect(resposta.status).toBe(200);
    expect(JSON.parse(texto)).toEqual({ status: 200, data: { data: [{ id: 1 }] } });
    expect(texto).not.toContain("jwt-do-servidor");
    expect(axiosRequest).toHaveBeenCalledTimes(1);
    expect(axiosRequest.mock.calls[0][0].headers.Authorization).toBe("Bearer jwt-do-servidor");
    expect(axiosRequest.mock.calls[0][0].url).toBe(`http://backend/api${url}`);
  });

  it("sem cookie de sessão: 401 e NADA é encaminhado ao backend", async () => {
    const resposta = await comoNavegador(new JarDeCookies(), () => POST(requisicao({ url, method: "GET" })));

    expect(resposta.status).toBe(401);
    expect(await resposta.json()).toEqual(expect.objectContaining({ tokenExpired: true }));
    expect(axiosRequest).not.toHaveBeenCalled();
  });

  it("sid inexistente (forjado), mesmo bem formado: 401", async () => {
    const jar = new JarDeCookies({ [`${contexto}_sid`]: "x".repeat(43) });

    const resposta = await comoNavegador(jar, () => POST(requisicao({ url, method: "GET" })));

    expect(resposta.status).toBe(401);
    expect(axiosRequest).not.toHaveBeenCalled();
  });

  it("sid malformado: 401 sem nem consultar o Redis", async () => {
    const jar = new JarDeCookies({ [`${contexto}_sid`]: "um-jwt.parecido.com-token" });
    const antes = harness.redis.comandos;

    const resposta = await comoNavegador(jar, () => POST(requisicao({ url, method: "GET" })));

    expect(resposta.status).toBe(401);
    expect(harness.redis.comandos).toBe(antes);
  });

  it("um JWT colocado no cookie no lugar do sid NÃO autentica (o cookie não é mais o token)", async () => {
    const jar = new JarDeCookies({ [`${contexto}_sid`]: "eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.assinatura" });

    const resposta = await comoNavegador(jar, () => POST(requisicao({ url, method: "GET" })));

    expect(resposta.status).toBe(401);
    expect(axiosRequest).not.toHaveBeenCalled();
  });

  it("sessão expirada (TTL vencido): 401", async () => {
    vi.useFakeTimers();
    try {
      const { sid } = await sessaoDeTeste(contexto, "jwt-do-servidor", 60);
      const jar = new JarDeCookies({ [`${contexto}_sid`]: sid });

      vi.advanceTimersByTime(61_000);

      const resposta = await comoNavegador(jar, () => POST(requisicao({ url, method: "GET" })));

      expect(resposta.status).toBe(401);
      expect(axiosRequest).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("sessão do OUTRO contexto apresentada neste cookie é recusada (sem escalar privilégio)", async () => {
    const { sid } = await sessaoDeTeste(outro, "jwt-do-outro-contexto");
    const jar = new JarDeCookies({ [`${contexto}_sid`]: sid }); // sid de outro contexto no cookie errado

    const resposta = await comoNavegador(jar, () => POST(requisicao({ url, method: "GET" })));

    expect(resposta.status).toBe(401);
    expect(axiosRequest).not.toHaveBeenCalled();
  });

  it("o navegador não consegue impor Authorization nem outros headers: só o token da sessão vale", async () => {
    const { sid } = await sessaoDeTeste(contexto, "jwt-do-servidor");
    const jar = new JarDeCookies({ [`${contexto}_sid`]: sid });

    await comoNavegador(jar, () =>
      POST(requisicao({ url, method: "GET", headers: { Authorization: "Bearer invasor", "X-Forwarded-For": "6.6.6.6" } }))
    );

    expect(axiosRequest.mock.calls[0][0].headers.Authorization).toBe("Bearer jwt-do-servidor");
    expect(JSON.stringify(axiosRequest.mock.calls[0][0].headers)).not.toContain("6.6.6.6");
  });

  it("401 do backend (token revogado/expirado) destrói a sessão e apaga o cookie", async () => {
    axiosRequest.mockResolvedValue({ status: 401, data: { message: "Unauthenticated" } });
    const { sid } = await sessaoDeTeste(contexto, "jwt-do-servidor");
    const jar = new JarDeCookies({ [`${contexto}_sid`]: sid });

    const resposta = await comoNavegador(jar, () => POST(requisicao({ url, method: "GET" })));

    expect(resposta.status).toBe(401);
    expect(await resposta.json()).toEqual(expect.objectContaining({ tokenExpired: true }));
    expect(await harness.store.obter(sid)).toBeNull();
    expect(jar.valor(`${contexto}_sid`)).toBeUndefined();
  });

  it("repassa 403/422 do backend sem derrubar a sessão", async () => {
    axiosRequest.mockResolvedValue({ status: 403, data: { errors: { business: ["Sem permissão."] } } });
    const { sid } = await sessaoDeTeste(contexto, "jwt-do-servidor");
    const jar = new JarDeCookies({ [`${contexto}_sid`]: sid });

    const resposta = await comoNavegador(jar, () => POST(requisicao({ url, method: "GET" })));

    expect(resposta.status).toBe(403);
    expect(await harness.store.obter(sid)).not.toBeNull();
  });

  it("Redis fora do ar: 503 (não 401), sem chamar o backend e sem vazar detalhes", async () => {
    const { sid } = await sessaoDeTeste(contexto, "jwt-do-servidor");
    const jar = new JarDeCookies({ [`${contexto}_sid`]: sid });
    harness.redis.indisponivel = true;

    const resposta = await comoNavegador(jar, () => POST(requisicao({ url, method: "GET" })));
    const texto = await resposta.text();

    expect(resposta.status).toBe(503);
    expect(texto).not.toContain("jwt-do-servidor");
    expect(texto).not.toContain("10.0.0.1");
    expect(axiosRequest).not.toHaveBeenCalled();
  });

  it("recusa origem não permitida (CSRF) antes de qualquer coisa", async () => {
    const { sid } = await sessaoDeTeste(contexto, "jwt-do-servidor");
    const jar = new JarDeCookies({ [`${contexto}_sid`]: sid });

    const resposta = await comoNavegador(jar, () => POST(requisicao({ url, method: "POST" }, "https://site-malicioso.example")));

    expect(resposta.status).toBe(403);
    expect(axiosRequest).not.toHaveBeenCalled();
  });

  it.each([
    ["URL absoluta de outro host (SSRF)", "http://169.254.169.254/latest/meta-data", "GET", 400],
    ["//host (protocol-relative)", "//evil.example/x", "GET", 400],
    ["path traversal", "/../../etc/passwd", "GET", 400],
    ["método fora da lista", "/usuarios", "TRACE", 405],
  ])("mesmo COM sessão válida: %s é recusado e não chega ao backend", async (_nome, destino, metodo, status) => {
    const { sid } = await sessaoDeTeste(contexto, "jwt-do-servidor");
    const jar = new JarDeCookies({ [`${contexto}_sid`]: sid });

    const resposta = await comoNavegador(jar, () => POST(requisicao({ url: destino, method: metodo })));

    expect(resposta.status).toBe(status);
    expect(axiosRequest).not.toHaveBeenCalled();
  });

  it("vários usuários em paralelo: cada requisição leva o token da PRÓPRIA sessão", async () => {
    const usuarios = await Promise.all(
      Array.from({ length: 25 }, async (_, i) => {
        const { sid } = await sessaoDeTeste(contexto, `jwt-usuario-${i}`);

        return { jwt: `jwt-usuario-${i}`, jar: new JarDeCookies({ [`${contexto}_sid`]: sid }) };
      })
    );

    axiosRequest.mockImplementation(async (cfg: { headers: { Authorization: string } }) => ({
      status: 200,
      data: { eco: cfg.headers.Authorization },
    }));

    const respostas = await Promise.all(
      usuarios.map(({ jar }) => comoNavegador(jar, () => POST(requisicao({ url, method: "GET" }))))
    );
    const corpos = await Promise.all(respostas.map((r) => r.json()));

    corpos.forEach((corpo, i) => {
      expect(corpo.data.eco).toBe(`Bearer ${usuarios[i].jwt}`); // sem troca de identidade
    });
  });

  it("o 401 de um usuário não derruba a sessão de outro", async () => {
    const a = await sessaoDeTeste(contexto, "jwt-a");
    const b = await sessaoDeTeste(contexto, "jwt-b");
    axiosRequest.mockImplementation(async (cfg: { headers: { Authorization: string } }) =>
      cfg.headers.Authorization === "Bearer jwt-a"
        ? { status: 401, data: {} }
        : { status: 200, data: { ok: true } }
    );

    const [ra, rb] = await Promise.all([
      comoNavegador(new JarDeCookies({ [`${contexto}_sid`]: a.sid }), () => POST(requisicao({ url, method: "GET" }))),
      comoNavegador(new JarDeCookies({ [`${contexto}_sid`]: b.sid }), () => POST(requisicao({ url, method: "GET" }))),
    ]);

    expect(ra.status).toBe(401);
    expect(rb.status).toBe(200);
    expect(await harness.store.obter(a.sid)).toBeNull();
    expect(await harness.store.obter(b.sid)).not.toBeNull();
  });
});

describe("proxy private — acesso de suporte", () => {
  const url = "/usuarios";

  it("com X-Acesso-Suporte-Id usa a sessão ADMIN (e não a Private) e repassa o header", async () => {
    const admin = await sessaoDeTeste("admin", "jwt-admin");
    const priv = await sessaoDeTeste("private", "jwt-private");
    const jar = new JarDeCookies({ admin_sid: admin.sid, private_sid: priv.sid });

    await comoNavegador(jar, () => proxyPrivate(requisicao({ url, method: "GET", headers: { "X-Acesso-Suporte-Id": SUPORTE } })));

    const cfg = axiosRequest.mock.calls[0][0];
    expect(cfg.headers.Authorization).toBe("Bearer jwt-admin");
    expect(cfg.headers["X-Acesso-Suporte-Id"]).toBe(SUPORTE);
  });

  it("com X-Acesso-Suporte-Id mas SEM sessão Admin: 401 (não cai para a sessão Private)", async () => {
    const priv = await sessaoDeTeste("private", "jwt-private");
    const jar = new JarDeCookies({ private_sid: priv.sid });

    const resposta = await comoNavegador(jar, () => proxyPrivate(requisicao({ url, method: "GET", headers: { "X-Acesso-Suporte-Id": SUPORTE } })));

    expect(resposta.status).toBe(401);
    expect(axiosRequest).not.toHaveBeenCalled();
  });

  it("sem o header usa a sessão Private, mesmo havendo sessão Admin no navegador", async () => {
    const admin = await sessaoDeTeste("admin", "jwt-admin");
    const priv = await sessaoDeTeste("private", "jwt-private");
    const jar = new JarDeCookies({ admin_sid: admin.sid, private_sid: priv.sid });

    await comoNavegador(jar, () => proxyPrivate(requisicao({ url, method: "GET" })));

    expect(axiosRequest.mock.calls[0][0].headers.Authorization).toBe("Bearer jwt-private");
  });

  it("401 do backend no acesso de suporte encerra a sessão ADMIN, não a Private", async () => {
    axiosRequest.mockResolvedValue({ status: 401, data: {} });
    const admin = await sessaoDeTeste("admin", "jwt-admin");
    const priv = await sessaoDeTeste("private", "jwt-private");
    const jar = new JarDeCookies({ admin_sid: admin.sid, private_sid: priv.sid });

    await comoNavegador(jar, () => proxyPrivate(requisicao({ url, method: "GET", headers: { "X-Acesso-Suporte-Id": SUPORTE } })));

    expect(await harness.store.obter(admin.sid)).toBeNull();
    expect(await harness.store.obter(priv.sid)).not.toBeNull();
  });
});
