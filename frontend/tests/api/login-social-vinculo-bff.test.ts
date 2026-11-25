/**
 * Vínculo de conta social (perfil → "Login social") no BFF, Admin e Private: exige sessão,
 * usa o JWT do Redis (nunca do navegador), grava o binding do VÍNCULO e devolve o usuário à aba.
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
import { POST as adminIniciarLogin } from "@/app/api/auth/admin/social/[provedor]/iniciar/route";
import { POST as adminVincular } from "@/app/api/auth/admin/social/[provedor]/vincular/route";
import { GET as privateCallback } from "@/app/api/auth/private/social/[provedor]/callback/route";
import { POST as privateIniciarLogin } from "@/app/api/auth/private/social/[provedor]/iniciar/route";
import { POST as privateVincular } from "@/app/api/auth/private/social/[provedor]/vincular/route";

import { comoNavegador, JarDeCookies } from "../helpers/cookies";
import { jwtComExp, reiniciarSessoes, sessaoDeTeste } from "../helpers/sessao";

const JWT = jwtComExp(3600);
const URL_GOOGLE = "https://accounts.google.com/o/oauth2/v2/auth?state=abc";

const casos = [
  {
    nome: "admin",
    vincular: adminVincular,
    callback: adminCallback,
    iniciarLogin: adminIniciarLogin,
    contexto: "admin",
    prefixoBackend: "/admin",
    login: "/admin",
    perfil: "/admin/perfil",
  },
  {
    nome: "private",
    vincular: privateVincular,
    callback: privateCallback,
    iniciarLogin: privateIniciarLogin,
    contexto: "private",
    prefixoBackend: "",
    login: "/",
    perfil: "/perfil",
  },
] as const;

const ctx = (provedor = "google") => ({ params: Promise.resolve({ provedor }) });

function reqVincular(corpo: unknown = { senha: "Senha123@" }, origem: string | null = "http://localhost:3000") {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (origem) headers.origin = origem;

  return new Request("http://localhost:3000/api/x", { method: "POST", headers, body: JSON.stringify(corpo) });
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

describe.each(casos)("vínculo social BFF $nome", (c) => {
  const comSessao = async (extras: Record<string, string> = {}) => {
    const { sid, cookie } = await sessaoDeTeste(c.contexto, JWT);

    return new JarDeCookies({ [cookie]: sid, ...extras });
  };

  describe("iniciar", () => {
    it("chama o backend com o JWT DA SESSÃO, senha e binding, e grava o cookie do vínculo", async () => {
      axiosPost.mockResolvedValue({ status: 200, data: { data: { url: URL_GOOGLE } } });
      const jar = await comSessao();

      const resposta = await comoNavegador(jar, () => c.vincular(reqVincular(), ctx()));

      expect(resposta.status).toBe(200);
      const json = await resposta.json();
      expect(json).toEqual({ data: { url: URL_GOOGLE } });

      const [url, corpo, config] = axiosPost.mock.calls[0];
      expect(url).toBe(`http://backend/api${c.prefixoBackend}/perfil/login-social/google/vincular/iniciar`);
      expect(corpo.senha).toBe("Senha123@");
      expect(corpo.binding).toMatch(/^[A-Za-z0-9_-]{43}$/);
      expect(config.headers.Authorization).toBe(`Bearer ${JWT}`);

      const gravado = jar.gravacoes.find((g) => g.nome === `${c.contexto}_social_vinculo`);
      expect(gravado?.valor).toBe(corpo.binding);
      expect(gravado?.opcoes).toEqual(expect.objectContaining({ httpOnly: true, sameSite: "lax", maxAge: 600 }));

      // O JWT nunca vai para o navegador.
      expect(JSON.stringify(json)).not.toContain(JWT);
      expect(JSON.stringify(jar.gravacoes)).not.toContain(JWT);
    });

    it("sem sessão: 401 e o backend não é chamado", async () => {
      const resposta = await comoNavegador(new JarDeCookies(), () => c.vincular(reqVincular(), ctx()));

      expect(resposta.status).toBe(401);
      expect(axiosPost).not.toHaveBeenCalled();
    });

    it("recusa origem não permitida", async () => {
      const resposta = await comoNavegador(await comSessao(), () => c.vincular(reqVincular(undefined, "http://malicioso.com"), ctx()));

      expect(resposta.status).toBe(403);
      expect(axiosPost).not.toHaveBeenCalled();
    });

    it.each([{}, { senha: "" }, { senha: 123 }, null])("exige senha (%j)", async (corpo) => {
      const resposta = await comoNavegador(await comSessao(), () => c.vincular(reqVincular(corpo), ctx()));

      expect(resposta.status).toBe(422);
      expect(axiosPost).not.toHaveBeenCalled();
    });

    it("recusa provedor com formato inválido", async () => {
      const resposta = await comoNavegador(await comSessao(), () => c.vincular(reqVincular(), ctx("../x")));

      expect(resposta.status).toBe(404);
      expect(axiosPost).not.toHaveBeenCalled();
    });

    it("senha incorreta (422 do backend) é repassada e nenhum cookie é gravado", async () => {
      axiosPost.mockResolvedValue({ status: 422, data: { errors: { business: ["A senha está incorreta."] } } });
      const jar = await comSessao();

      const resposta = await comoNavegador(jar, () => c.vincular(reqVincular(), ctx()));

      expect(resposta.status).toBe(422);
      expect(await resposta.json()).toEqual({ errors: { business: ["A senha está incorreta."] } });
      expect(jar.gravacoes.some((g) => g.nome === `${c.contexto}_social_vinculo`)).toBe(false);
    });

    it.each(["javascript:alert(1)", null])("não segue URL inválida do backend (%s)", async (url) => {
      axiosPost.mockResolvedValue({ status: 200, data: { data: { url } } });

      const resposta = await comoNavegador(await comSessao(), () => c.vincular(reqVincular(), ctx()));

      expect(resposta.status).toBe(500);
    });

    it("iniciar o vínculo descarta um login pendente (um fluxo por vez)", async () => {
      axiosPost.mockResolvedValue({ status: 200, data: { data: { url: URL_GOOGLE } } });
      const jar = await comSessao({ [`${c.contexto}_social`]: "login-abandonado" });

      await comoNavegador(jar, () => c.vincular(reqVincular(), ctx()));

      expect(jar.valor(`${c.contexto}_social`)).toBeUndefined();
    });
  });

  describe("callback de vínculo", () => {
    const comSessaoEVinculo = () => comSessao({ [`${c.contexto}_social_vinculo`]: "binding-do-vinculo" });

    it("entrega code/state/binding ao backend COM O JWT da sessão e volta à aba com ?vinculo=ok", async () => {
      axiosPost.mockResolvedValue({ status: 200, data: { data: { vinculado: true } } });
      const jar = await comSessaoEVinculo();

      const resposta = await comoNavegador(jar, () => c.callback(reqCallback("code=cod&state=st"), ctx()));

      expect(resposta.status).toBe(303);
      expect(resposta.headers.get("location")).toBe(`http://localhost:3000${c.perfil}?aba=login-social&vinculo=ok`);

      const [url, corpo, config] = axiosPost.mock.calls[0];
      expect(url).toBe(`http://backend/api${c.prefixoBackend}/perfil/login-social/google/vincular/callback`);
      expect(corpo).toEqual({ codigo: "cod", state: "st", binding: "binding-do-vinculo" });
      expect(config.headers.Authorization).toBe(`Bearer ${JWT}`);

      // uso único + NÃO abre sessão nova (a sessão atual segue a mesma)
      expect(jar.valor(`${c.contexto}_social_vinculo`)).toBeUndefined();
      expect(jar.gravacoes.some((g) => g.nome === `${c.contexto}_sid` && g.valor !== "")).toBe(false);
    });

    it.each([
      [422, "invalido"],
      [429, "limite"],
      [503, "indisponivel"],
    ])("backend %i volta à aba com ?vinculo=%s (sem texto do backend na URL)", async (status, resultado) => {
      axiosPost.mockResolvedValue({ status, data: { errors: { business: ["detalhe interno"] } } });

      const resposta = await comoNavegador(await comSessaoEVinculo(), () => c.callback(reqCallback("code=cod&state=st"), ctx()));

      expect(resposta.headers.get("location")).toBe(`http://localhost:3000${c.perfil}?aba=login-social&vinculo=${resultado}`);
      expect(resposta.headers.get("location")).not.toContain("detalhe");
    });

    it("backend 401 (sessão inválida) volta ao LOGIN, não ao perfil", async () => {
      axiosPost.mockResolvedValue({ status: 401, data: {} });

      const resposta = await comoNavegador(await comSessaoEVinculo(), () => c.callback(reqCallback("code=cod&state=st"), ctx()));

      expect(resposta.headers.get("location")).toBe(`http://localhost:3000${c.login}?erro=social_expirado`);
    });

    it("sessão expirada no meio do caminho volta ao login e não chama o backend", async () => {
      const jar = new JarDeCookies({ [`${c.contexto}_social_vinculo`]: "binding-do-vinculo" });

      const resposta = await comoNavegador(jar, () => c.callback(reqCallback("code=cod&state=st"), ctx()));

      expect(resposta.headers.get("location")).toBe(`http://localhost:3000${c.login}?erro=social_expirado`);
      expect(axiosPost).not.toHaveBeenCalled();
    });

    it("usuário cancelou no provedor: volta à aba com ?vinculo=cancelado sem chamar o backend", async () => {
      const resposta = await comoNavegador(await comSessaoEVinculo(), () =>
        c.callback(reqCallback("error=access_denied&state=st"), ctx())
      );

      expect(resposta.headers.get("location")).toBe(`http://localhost:3000${c.perfil}?aba=login-social&vinculo=cancelado`);
      expect(axiosPost).not.toHaveBeenCalled();
    });

    it("parâmetros incompletos não chamam o backend", async () => {
      const resposta = await comoNavegador(await comSessaoEVinculo(), () => c.callback(reqCallback("state=st"), ctx()));

      expect(resposta.headers.get("location")).toContain("vinculo=invalido");
      expect(axiosPost).not.toHaveBeenCalled();
    });

    it("com o cookie de vínculo o callback NUNCA cria sessão de login (usa só o endpoint de vínculo)", async () => {
      axiosPost.mockResolvedValue({ status: 200, data: { data: { "2fa_enable": false, token: "outro-jwt" } } });

      await comoNavegador(await comSessaoEVinculo(), () => c.callback(reqCallback("code=cod&state=st"), ctx()));

      expect(axiosPost.mock.calls.every(([url]) => String(url).includes("/perfil/login-social/"))).toBe(true);
    });
  });

  it("iniciar um LOGIN social descarta um vínculo pendente (um fluxo por vez)", async () => {
    axiosPost.mockResolvedValue({ status: 200, data: { data: { url: URL_GOOGLE } } });
    const jar = new JarDeCookies({ [`${c.contexto}_social_vinculo`]: "vinculo-abandonado" });

    await comoNavegador(jar, () =>
      c.iniciarLogin(
        new Request("http://localhost:3000/api/x", {
          method: "POST",
          headers: { "content-type": "application/json", origin: "http://localhost:3000" },
          body: "{}",
        }),
        ctx()
      )
    );

    expect(jar.valor(`${c.contexto}_social_vinculo`)).toBeUndefined();
  });
});
