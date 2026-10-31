/**
 * SEC-009: o JWT só pode existir no servidor (Redis). O navegador recebe um cookie de sessão
 * OPACO. Roda para os 4 handlers (Admin e Private × login e 2FA).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const axiosPost = vi.hoisted(() => vi.fn());

vi.mock("next/headers", async () => ({ cookies: (await import("../helpers/cookies")).cookiesFalsos }));
vi.mock("axios", () => ({ default: { post: axiosPost } }));
vi.mock("@/lib/session/store", async () => {
  const { harness } = await import("../helpers/sessao");

  return { getSessionStore: () => harness.store };
});

import { POST as admin2fa } from "@/app/api/auth/admin/2fa/route";
import { POST as adminLogin } from "@/app/api/auth/admin/login/route";
import { POST as private2fa } from "@/app/api/auth/private/2fa/route";
import { POST as privateLogin } from "@/app/api/auth/private/login/route";

import { comoNavegador, JarDeCookies } from "../helpers/cookies";
import { harness, jwtComExp, reiniciarSessoes } from "../helpers/sessao";

const JWT = "eyJ.jwt-secreto-da-sessao.assinatura";

const casos = [
  { nome: "admin login", POST: adminLogin, caminho: "/admin/login", contexto: "admin", doisFatores: false },
  { nome: "private login", POST: privateLogin, caminho: "/login", contexto: "private", doisFatores: false },
  { nome: "admin 2fa", POST: admin2fa, caminho: "/admin/2fa/verificar", contexto: "admin", doisFatores: true },
  { nome: "private 2fa", POST: private2fa, caminho: "/2fa/verificar", contexto: "private", doisFatores: true },
] as const;

function requisicao(origem: string | null = "http://localhost:3000") {
  const headers: Record<string, string> = { "content-type": "application/json", "user-agent": "vitest" };
  if (origem) headers.origin = origem;

  return new Request("http://localhost:3000/api/auth/x", { method: "POST", headers, body: JSON.stringify({ email: "a@b.com" }) });
}

beforeEach(() => {
  axiosPost.mockReset();
  reiniciarSessoes();
  vi.stubEnv("BACKEND_URL", "http://backend/api");
  vi.stubEnv("FRONTEND_URL", "http://localhost:3000");
});

describe.each(casos)("BFF $nome", ({ POST, caminho, contexto }) => {
  it("cria a sessão no servidor, grava só um cookie OPACO e NÃO devolve o JWT em lugar nenhum", async () => {
    axiosPost.mockResolvedValue({
      status: 200,
      data: { data: { token: JWT, token_type: "bearer", usuario: { id: "u1", nome: "Maria" } } },
    });
    const jar = new JarDeCookies();

    const resposta = await comoNavegador(jar, () => POST(requisicao()));
    const texto = await resposta.text();

    expect(resposta.status).toBe(200);
    expect(texto).not.toContain(JWT);
    expect(JSON.parse(texto)).toEqual({
      status: 200,
      data: { token_type: "bearer", usuario: { id: "u1", nome: "Maria" } },
    });

    // o navegador recebe UM cookie: o identificador da sessão, sem relação com o JWT
    expect(jar.gravacoes).toHaveLength(1);
    const [{ nome, valor, opcoes }] = jar.gravacoes;
    expect(nome).toBe(`${contexto}_sid`);
    expect(valor).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(valor).not.toContain(JWT);
    expect(opcoes).toEqual(expect.objectContaining({ httpOnly: true, sameSite: "lax", path: "/", maxAge: 3600 }));

    // o JWT está no servidor, associado ao sid e ao contexto certos
    const sessao = await harness.store.obter(valor);
    expect(sessao).toEqual(expect.objectContaining({ contexto, token: JWT }));
  });

  it("a sessão dura o mesmo que o JWT (exp), não mais", async () => {
    axiosPost.mockResolvedValue({ status: 200, data: { data: { token: jwtComExp(900) } } });
    const jar = new JarDeCookies();

    await comoNavegador(jar, () => POST(requisicao()));

    const maxAge = jar.gravacoes[0].opcoes?.maxAge ?? 0;
    expect(maxAge).toBeGreaterThan(890);
    expect(maxAge).toBeLessThanOrEqual(900);
  });

  it("chama o backend na rota certa", async () => {
    axiosPost.mockResolvedValue({ status: 200, data: { data: { token: JWT } } });

    await comoNavegador(new JarDeCookies(), () => POST(requisicao()));

    expect(axiosPost).toHaveBeenCalledWith(`http://backend/api${caminho}`, { email: "a@b.com" }, expect.any(Object));
  });

  it("repassa o erro do backend exatamente como veio e não cria sessão nem cookie", async () => {
    const erro = { errors: { business: ["Credenciais inválidas."] } };
    axiosPost.mockResolvedValue({ status: 401, data: erro });
    const jar = new JarDeCookies();

    const resposta = await comoNavegador(jar, () => POST(requisicao()));

    expect(resposta.status).toBe(401);
    expect(await resposta.json()).toEqual(erro);
    expect(jar.gravacoes).toHaveLength(0);
    expect(harness.redis.total()).toBe(0);
  });

  it("recusa origem não permitida sem chamar o backend nem criar sessão", async () => {
    const jar = new JarDeCookies();

    const resposta = await comoNavegador(jar, () => POST(requisicao("https://site-malicioso.example")));

    expect(resposta.status).toBe(403);
    expect(axiosPost).not.toHaveBeenCalled();
    expect(jar.gravacoes).toHaveLength(0);
    expect(harness.redis.total()).toBe(0);
  });

  it("devolve 500 genérico (sem vazar detalhes) quando o backend falha", async () => {
    axiosPost.mockRejectedValue(new Error("ECONNREFUSED 10.0.0.5:443 segredo-interno"));
    const jar = new JarDeCookies();

    const resposta = await comoNavegador(jar, () => POST(requisicao()));
    const texto = await resposta.text();

    expect(resposta.status).toBe(500);
    expect(texto).not.toContain("segredo-interno");
    expect(jar.gravacoes).toHaveLength(0);
  });

  it("novo login no mesmo navegador DESTRÓI a sessão anterior e troca o sid (anti fixação de sessão)", async () => {
    axiosPost.mockResolvedValueOnce({ status: 200, data: { data: { token: "jwt-um" } } });
    const jar = new JarDeCookies();

    await comoNavegador(jar, () => POST(requisicao()));
    const sidAntigo = jar.valor(`${contexto}_sid`)!;

    axiosPost.mockResolvedValueOnce({ status: 200, data: { data: { token: "jwt-dois" } } });
    await comoNavegador(jar, () => POST(requisicao()));
    const sidNovo = jar.valor(`${contexto}_sid`)!;

    expect(sidNovo).not.toBe(sidAntigo);
    expect(await harness.store.obter(sidAntigo)).toBeNull();
    expect((await harness.store.obter(sidNovo))?.token).toBe("jwt-dois");
    expect(harness.redis.total()).toBe(1); // nada de sessão órfã no Redis
  });

  it("com o Redis fora do ar responde 503, sem cookie e sem vazar o JWT nem detalhes de conexão", async () => {
    axiosPost.mockResolvedValue({ status: 200, data: { data: { token: JWT } } });
    harness.redis.indisponivel = true;
    const jar = new JarDeCookies();

    const resposta = await comoNavegador(jar, () => POST(requisicao()));
    const texto = await resposta.text();

    expect(resposta.status).toBe(503);
    expect(texto).not.toContain(JWT);
    expect(texto).not.toContain("10.0.0.1");
    expect(texto).not.toContain("segredo");
    expect(jar.gravacoes).toHaveLength(0);
  });

  it("vários usuários ao mesmo tempo: cada login recebe a PRÓPRIA sessão, sem misturar tokens", async () => {
    // cada chamada ao backend devolve um token diferente (dois usuários distintos)
    let n = 0;
    axiosPost.mockImplementation(async () => ({ status: 200, data: { data: { token: `jwt-do-usuario-${++n}` } } }));

    const jars = Array.from({ length: 20 }, () => new JarDeCookies());

    await Promise.all(jars.map((jar) => comoNavegador(jar, () => POST(requisicao()))));

    const sids = jars.map((j) => j.valor(`${contexto}_sid`)!);
    expect(new Set(sids).size).toBe(20); // 20 sids distintos
    expect(harness.redis.total()).toBe(20);

    const tokens = await Promise.all(sids.map(async (sid) => (await harness.store.obter(sid))?.token));
    expect(new Set(tokens).size).toBe(20); // cada sessão guarda um token diferente
  });
});

describe.each(casos.filter((c) => !c.doisFatores))("BFF $nome — login com 2FA habilitado", ({ POST, contexto }) => {
  it("devolve o temp_token ao navegador e NÃO cria nem mexe na sessão", async () => {
    axiosPost.mockResolvedValue({
      status: 200,
      data: { data: { "2fa_enable": true, temp_token: "7f9c24e8-3b12-4e8a-9d11-0c8d5a1b2f33" } },
    });
    const jar = new JarDeCookies({ [`${contexto}_sid`]: "sid-existente" });

    const resposta = await comoNavegador(jar, () => POST(requisicao()));

    expect(await resposta.json()).toEqual({
      status: 200,
      data: { "2fa_enable": true, temp_token: "7f9c24e8-3b12-4e8a-9d11-0c8d5a1b2f33" },
    });
    // antes o cookie era gravado vazio, apagando uma sessão válida do mesmo contexto
    expect(jar.gravacoes).toHaveLength(0);
    expect(jar.valor(`${contexto}_sid`)).toBe("sid-existente");
    expect(harness.redis.total()).toBe(0);
  });
});

describe.each(casos.filter((c) => c.doisFatores))("BFF $nome — resposta sem token", ({ POST }) => {
  it("falha com 500 e não cria sessão quando o backend não devolve o token", async () => {
    axiosPost.mockResolvedValue({ status: 200, data: { data: { usuario: { id: "u1" } } } });
    const jar = new JarDeCookies();

    const resposta = await comoNavegador(jar, () => POST(requisicao()));

    expect(resposta.status).toBe(500);
    expect(await resposta.json()).toEqual({ errors: { business: ["Token não retornado após validação do 2FA."] } });
    expect(jar.gravacoes).toHaveLength(0);
    expect(harness.redis.total()).toBe(0);
  });
});
