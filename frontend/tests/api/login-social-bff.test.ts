/**
 * Login social no BFF (Admin e Private): binding em cookie httpOnly, retorno do provedor,
 * sessão opaca (SEC-009) e 2FA sem expor token na URL do servidor.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const axiosPost = vi.hoisted(() => vi.fn());
const axiosGet = vi.hoisted(() => vi.fn());

vi.mock("next/headers", async () => ({ cookies: (await import("../helpers/cookies")).cookiesFalsos }));
vi.mock("axios", () => ({ default: { post: axiosPost, get: axiosGet } }));
vi.mock("@/lib/session/store", async () => {
  const { harness } = await import("../helpers/sessao");

  return { getSessionStore: () => harness.store };
});

import { GET as adminCallback } from "@/app/api/auth/admin/social/[provedor]/callback/route";
import { POST as adminIniciar } from "@/app/api/auth/admin/social/[provedor]/iniciar/route";
import { GET as adminProvedores } from "@/app/api/auth/admin/social/provedores/route";
import { GET as privateCallback } from "@/app/api/auth/private/social/[provedor]/callback/route";
import { POST as privateIniciar } from "@/app/api/auth/private/social/[provedor]/iniciar/route";
import { GET as privateProvedores } from "@/app/api/auth/private/social/provedores/route";

import { comoNavegador, JarDeCookies } from "../helpers/cookies";
import { harness, reiniciarSessoes } from "../helpers/sessao";

const JWT = "eyJ.jwt-secreto-da-sessao.assinatura";
const URL_GOOGLE = "https://accounts.google.com/o/oauth2/v2/auth?state=abc";

const casos = [
  {
    nome: "admin",
    iniciar: adminIniciar,
    callback: adminCallback,
    provedores: adminProvedores,
    contexto: "admin",
    prefixoBackend: "/admin",
    login: "/admin",
    home: "/admin/home",
  },
  {
    nome: "private",
    iniciar: privateIniciar,
    callback: privateCallback,
    provedores: privateProvedores,
    contexto: "private",
    prefixoBackend: "",
    login: "/",
    home: "/home",
  },
] as const;

const ctx = (provedor = "google") => ({ params: Promise.resolve({ provedor }) });

function reqIniciar(origem: string | null = "http://localhost:3000") {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (origem) headers.origin = origem;

  return new Request("http://localhost:3000/api/x", { method: "POST", headers, body: "{}" });
}

function reqCallback(query: string) {
  return new Request(`http://localhost:3000/api/x?${query}`, { headers: { "user-agent": "vitest" } });
}

beforeEach(() => {
  axiosPost.mockReset();
  axiosGet.mockReset();
  reiniciarSessoes();
  vi.stubEnv("BACKEND_URL", "http://backend/api");
  vi.stubEnv("FRONTEND_URL", "http://localhost:3000");
});

describe.each(casos)("login social BFF $nome", (c) => {
  describe("provedores", () => {
    it("repassa só chave e nome dos provedores ativos", async () => {
      axiosGet.mockResolvedValue({
        status: 200,
        data: { data: { provedores: [{ chave: "google", nome: "Google", segredo: "x" }, { chave: "../ruim", nome: "X" }] } },
      });

      const resposta = await c.provedores();

      expect(axiosGet).toHaveBeenCalledWith(`http://backend/api${c.prefixoBackend}/login/social/provedores`, expect.any(Object));
      expect(await resposta.json()).toEqual({ data: { provedores: [{ chave: "google", nome: "Google" }] } });
    });

    it("se o backend falhar, devolve lista vazia (sem botões) em vez de erro", async () => {
      axiosGet.mockRejectedValue(new Error("fora do ar"));

      expect(await (await c.provedores()).json()).toEqual({ data: { provedores: [] } });

      axiosGet.mockResolvedValue({ status: 500, data: {} });

      expect(await (await c.provedores()).json()).toEqual({ data: { provedores: [] } });
    });
  });

  describe("iniciar", () => {
    it("manda um binding aleatório ao backend, grava o MESMO valor em cookie httpOnly e devolve só a URL", async () => {
      axiosPost.mockResolvedValue({ status: 200, data: { data: { url: URL_GOOGLE } } });
      const jar = new JarDeCookies();

      const resposta = await comoNavegador(jar, () => c.iniciar(reqIniciar(), ctx()));

      expect(resposta.status).toBe(200);
      expect(await resposta.json()).toEqual({ data: { url: URL_GOOGLE } });

      const [url, corpo] = axiosPost.mock.calls[0];
      expect(url).toBe(`http://backend/api${c.prefixoBackend}/login/social/google/iniciar`);
      expect(corpo.binding).toMatch(/^[A-Za-z0-9_-]{43}$/);

      // Grava o binding do login (e apaga um eventual vínculo pendente: ver login-social-vinculo-bff).
      const gravados = jar.gravacoes.filter((g) => g.valor !== "");
      expect(gravados).toHaveLength(1);
      const [{ nome, valor, opcoes }] = gravados;
      expect(nome).toBe(`${c.contexto}_social`);
      expect(valor).toBe(corpo.binding);
      expect(opcoes).toEqual(expect.objectContaining({ httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 }));
    });

    it("cada início gera um binding diferente", async () => {
      axiosPost.mockResolvedValue({ status: 200, data: { data: { url: URL_GOOGLE } } });

      await comoNavegador(new JarDeCookies(), () => c.iniciar(reqIniciar(), ctx()));
      await comoNavegador(new JarDeCookies(), () => c.iniciar(reqIniciar(), ctx()));

      expect(axiosPost.mock.calls[0][1].binding).not.toBe(axiosPost.mock.calls[1][1].binding);
    });

    it("recusa origem não permitida sem chamar o backend", async () => {
      const resposta = await comoNavegador(new JarDeCookies(), () => c.iniciar(reqIniciar("http://malicioso.com"), ctx()));

      expect(resposta.status).toBe(403);
      expect(axiosPost).not.toHaveBeenCalled();
    });

    it("recusa provedor com formato inválido sem chamar o backend", async () => {
      const resposta = await comoNavegador(new JarDeCookies(), () => c.iniciar(reqIniciar(), ctx("../admin")));

      expect(resposta.status).toBe(404);
      expect(axiosPost).not.toHaveBeenCalled();
    });

    it("erro do backend é repassado e nenhum cookie é gravado", async () => {
      axiosPost.mockResolvedValue({ status: 404, data: { errors: { business: ["Provedor de login não disponível."] } } });
      const jar = new JarDeCookies();

      const resposta = await comoNavegador(jar, () => c.iniciar(reqIniciar(), ctx()));

      expect(resposta.status).toBe(404);
      expect(jar.gravacoes).toHaveLength(0);
    });

    it.each(["javascript:alert(1)", "data:text/html,x", "", null])("não segue URL do backend inválida (%s)", async (url) => {
      axiosPost.mockResolvedValue({ status: 200, data: { data: { url } } });
      const jar = new JarDeCookies();

      const resposta = await comoNavegador(jar, () => c.iniciar(reqIniciar(), ctx()));

      expect(resposta.status).toBe(500);
      expect(jar.gravacoes).toHaveLength(0);
    });
  });

  describe("callback", () => {
    const comBinding = () => new JarDeCookies({ [`${c.contexto}_social`]: "binding-do-navegador" });

    it("entrega code/state/binding ao backend, cria sessão OPACA e redireciona para a home", async () => {
      axiosPost.mockResolvedValue({ status: 200, data: { data: { "2fa_enable": false, token: JWT, expires_in: 3600 } } });
      const jar = comBinding();

      const resposta = await comoNavegador(jar, () => c.callback(reqCallback("code=cod&state=st"), ctx()));

      expect(resposta.status).toBe(303);
      expect(resposta.headers.get("location")).toBe(`http://localhost:3000${c.home}?login_social=1`);
      expect(resposta.headers.get("location")).not.toContain(JWT);

      expect(axiosPost).toHaveBeenCalledWith(
        `http://backend/api${c.prefixoBackend}/login/social/google/callback`,
        { codigo: "cod", state: "st", binding: "binding-do-navegador" },
        expect.any(Object)
      );

      // cookie de sessão opaco + binding apagado (uso único)
      const sid = jar.gravacoes.find((g) => g.nome === `${c.contexto}_sid`);
      expect(sid?.valor).toMatch(/^[A-Za-z0-9_-]{43}$/);
      expect(sid?.valor).not.toContain(JWT);
      expect(jar.valor(`${c.contexto}_social`)).toBeUndefined();

      expect(await harness.store.obter(sid!.valor)).toEqual(expect.objectContaining({ contexto: c.contexto, token: JWT }));
    });

    it("2FA: não cria sessão e leva o temp_token no FRAGMENTO da URL", async () => {
      axiosPost.mockResolvedValue({ status: 200, data: { data: { "2fa_enable": true, temp_token: "uuid-temp" } } });
      const jar = comBinding();

      const resposta = await comoNavegador(jar, () => c.callback(reqCallback("code=cod&state=st"), ctx()));

      expect(resposta.status).toBe(303);
      expect(resposta.headers.get("location")).toBe(`http://localhost:3000${c.login}#social-2fa=uuid-temp`);
      expect(jar.gravacoes.some((g) => g.nome === `${c.contexto}_sid`)).toBe(false);
      expect(harness.redis.total()).toBe(0);
    });

    it.each([
      [401, "social_negado"],
      [422, "social_expirado"],
      [429, "social_limite"],
      [503, "social_indisponivel"],
    ])("backend %i redireciona para o login com ?erro=%s e sem sessão", async (status, erro) => {
      axiosPost.mockResolvedValue({ status, data: { errors: { business: ["detalhe interno"] } } });
      const jar = comBinding();

      const resposta = await comoNavegador(jar, () => c.callback(reqCallback("code=cod&state=st"), ctx()));

      expect(resposta.status).toBe(303);
      expect(resposta.headers.get("location")).toBe(`http://localhost:3000${c.login}?erro=${erro}`);
      expect(resposta.headers.get("location")).not.toContain("detalhe");
      expect(harness.redis.total()).toBe(0);
      expect(jar.valor(`${c.contexto}_social`)).toBeUndefined();
    });

    it("usuário cancelou no provedor: não chama o backend", async () => {
      const resposta = await comoNavegador(comBinding(), () =>
        c.callback(reqCallback("error=access_denied&state=st"), ctx())
      );

      expect(resposta.headers.get("location")).toBe(`http://localhost:3000${c.login}?erro=social_cancelado`);
      expect(axiosPost).not.toHaveBeenCalled();
    });

    it("sem o cookie de binding (outro navegador) não chama o backend", async () => {
      const resposta = await comoNavegador(new JarDeCookies(), () => c.callback(reqCallback("code=cod&state=st"), ctx()));

      expect(resposta.headers.get("location")).toBe(`http://localhost:3000${c.login}?erro=social_expirado`);
      expect(axiosPost).not.toHaveBeenCalled();
    });

    it.each(["state=st", "code=cod", ""])("parâmetros incompletos (%s) não chamam o backend", async (query) => {
      const resposta = await comoNavegador(comBinding(), () => c.callback(reqCallback(query), ctx()));

      expect(resposta.status).toBe(303);
      expect(axiosPost).not.toHaveBeenCalled();
    });

    it("falha de rede com o backend não vaza detalhes", async () => {
      axiosPost.mockRejectedValue(new Error("ECONNREFUSED http://backend/api"));

      const resposta = await comoNavegador(comBinding(), () => c.callback(reqCallback("code=cod&state=st"), ctx()));

      expect(resposta.headers.get("location")).toBe(`http://localhost:3000${c.login}?erro=social_indisponivel`);
    });
  });
});

it("o cookie do binding de uma área não vale na outra", async () => {
  const jar = new JarDeCookies({ admin_social: "binding-admin" });

  const resposta = await comoNavegador(jar, () => privateCallback(reqCallback("code=c&state=s"), ctx()));

  expect(resposta.headers.get("location")).toBe("http://localhost:3000/?erro=social_expirado");
  expect(axiosPost).not.toHaveBeenCalled();
});
