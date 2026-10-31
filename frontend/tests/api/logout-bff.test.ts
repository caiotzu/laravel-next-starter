/**
 * SEC-009: logout encerra a sessão NO SERVIDOR (Redis), apaga o cookie e revoga o token no
 * backend — e não deixa o usuário "preso" se o backend ou o Redis falharem.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const axiosPost = vi.hoisted(() => vi.fn());

vi.mock("next/headers", async () => ({ cookies: (await import("../helpers/cookies")).cookiesFalsos }));
vi.mock("axios", () => ({ default: { post: axiosPost } }));
vi.mock("@/lib/session/store", async () => {
  const { harness } = await import("../helpers/sessao");

  return { getSessionStore: () => harness.store };
});

import { POST as adminLogout } from "@/app/api/auth/admin/logout/route";
import { POST as privateLogout } from "@/app/api/auth/private/logout/route";

import { comoNavegador, JarDeCookies } from "../helpers/cookies";
import { harness, reiniciarSessoes, sessaoDeTeste } from "../helpers/sessao";

const casos = [
  { nome: "admin", POST: adminLogout, contexto: "admin", outro: "private", caminho: "/admin/logout" },
  { nome: "private", POST: privateLogout, contexto: "private", outro: "admin", caminho: "/logout" },
] as const;

function requisicao(origem: string | null = "http://localhost:3000") {
  const headers: Record<string, string> = { "content-type": "application/json", "user-agent": "vitest" };
  if (origem) headers.origin = origem;

  return new Request("http://localhost:3000/api/auth/x/logout", { method: "POST", headers });
}

beforeEach(() => {
  axiosPost.mockReset().mockResolvedValue({ status: 200, data: { data: { message: "ok" } } });
  reiniciarSessoes();
  vi.stubEnv("BACKEND_URL", "http://backend/api");
  vi.stubEnv("FRONTEND_URL", "http://localhost:3000");
});

describe.each(casos)("logout $nome", ({ POST, contexto, outro, caminho }) => {
  it("destrói a sessão no servidor, apaga o cookie e revoga o token no backend", async () => {
    const { sid } = await sessaoDeTeste(contexto, "jwt-secreto");
    const jar = new JarDeCookies({ [`${contexto}_sid`]: sid });

    const resposta = await comoNavegador(jar, () => POST(requisicao()));
    const texto = await resposta.text();

    expect(resposta.status).toBe(200);
    expect(texto).not.toContain("jwt-secreto");
    expect(await harness.store.obter(sid)).toBeNull();
    expect(jar.valor(`${contexto}_sid`)).toBeUndefined();
    expect(jar.gravacoes.at(-1)).toEqual(
      expect.objectContaining({ nome: `${contexto}_sid`, valor: "", opcoes: expect.objectContaining({ maxAge: 0, httpOnly: true, path: "/" }) })
    );

    // o token que vai ao backend vem do SERVIDOR (sessão), nunca do navegador
    expect(axiosPost).toHaveBeenCalledWith(
      `http://backend/api${caminho}`,
      {},
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer jwt-secreto" }) })
    );
  });

  it("encerra a sessão mesmo se o backend responder erro", async () => {
    axiosPost.mockResolvedValue({ status: 500, data: { errors: { business: ["falhou"] } } });
    const { sid } = await sessaoDeTeste(contexto, "jwt-secreto");
    const jar = new JarDeCookies({ [`${contexto}_sid`]: sid });

    const resposta = await comoNavegador(jar, () => POST(requisicao()));

    expect(resposta.status).toBe(200);
    expect(await harness.store.obter(sid)).toBeNull();
    expect(jar.valor(`${contexto}_sid`)).toBeUndefined();
  });

  it("encerra a sessão mesmo se o backend estiver inacessível", async () => {
    axiosPost.mockRejectedValue(new Error("ETIMEDOUT"));
    const { sid } = await sessaoDeTeste(contexto, "jwt-secreto");
    const jar = new JarDeCookies({ [`${contexto}_sid`]: sid });

    const resposta = await comoNavegador(jar, () => POST(requisicao()));

    expect(resposta.status).toBe(200);
    expect(await harness.store.obter(sid)).toBeNull();
    expect(jar.valor(`${contexto}_sid`)).toBeUndefined();
  });

  it("com o Redis fora do ar o cookie é apagado do mesmo jeito (o registro expira sozinho pelo TTL)", async () => {
    const { sid } = await sessaoDeTeste(contexto, "jwt-secreto");
    const jar = new JarDeCookies({ [`${contexto}_sid`]: sid });
    harness.redis.indisponivel = true;

    const resposta = await comoNavegador(jar, () => POST(requisicao()));

    expect(resposta.status).toBe(200);
    expect(jar.valor(`${contexto}_sid`)).toBeUndefined();
    expect(axiosPost).not.toHaveBeenCalled(); // sem Redis não há token para revogar
  });

  it("sem sessão é idempotente: 200, não chama o backend", async () => {
    const jar = new JarDeCookies();

    const resposta = await comoNavegador(jar, () => POST(requisicao()));

    expect(resposta.status).toBe(200);
    expect(axiosPost).not.toHaveBeenCalled();
  });

  it("cookie com sid malformado é apagado sem consultar o Redis", async () => {
    const jar = new JarDeCookies({ [`${contexto}_sid`]: "../../chave-qualquer" });
    const antes = harness.redis.comandos;

    const resposta = await comoNavegador(jar, () => POST(requisicao()));

    expect(resposta.status).toBe(200);
    expect(harness.redis.comandos).toBe(antes);
    expect(jar.valor(`${contexto}_sid`)).toBeUndefined();
  });

  it("recusa origem não permitida (CSRF) e NÃO encerra a sessão", async () => {
    const { sid } = await sessaoDeTeste(contexto, "jwt-secreto");
    const jar = new JarDeCookies({ [`${contexto}_sid`]: sid });

    const resposta = await comoNavegador(jar, () => POST(requisicao("https://site-malicioso.example")));

    expect(resposta.status).toBe(403);
    expect(await harness.store.obter(sid)).not.toBeNull();
    expect(axiosPost).not.toHaveBeenCalled();
  });

  it("não encerra a sessão do OUTRO contexto aberta no mesmo navegador", async () => {
    const minha = await sessaoDeTeste(contexto, "jwt-minha");
    const outra = await sessaoDeTeste(outro, "jwt-outra");
    const jar = new JarDeCookies({ [`${contexto}_sid`]: minha.sid, [`${outro}_sid`]: outra.sid });

    await comoNavegador(jar, () => POST(requisicao()));

    expect(await harness.store.obter(minha.sid)).toBeNull();
    expect((await harness.store.obter(outra.sid))?.token).toBe("jwt-outra");
    expect(jar.valor(`${outro}_sid`)).toBe(outra.sid);
  });

  it("o logout de um usuário NÃO derruba a sessão de outro usuário", async () => {
    const maria = await sessaoDeTeste(contexto, "jwt-maria");
    const joao = await sessaoDeTeste(contexto, "jwt-joao");
    const jarMaria = new JarDeCookies({ [`${contexto}_sid`]: maria.sid });

    await comoNavegador(jarMaria, () => POST(requisicao()));

    expect(await harness.store.obter(maria.sid)).toBeNull();
    expect((await harness.store.obter(joao.sid))?.token).toBe("jwt-joao");
  });

  it("sid forjado (bem formado, mas inexistente) não revoga nada e não chama o backend", async () => {
    // o sid é a credencial da sessão: sem um sid existente não há token a revogar
    const jar = new JarDeCookies({ [`${contexto}_sid`]: "A".repeat(43) });

    const resposta = await comoNavegador(jar, () => POST(requisicao()));

    expect(resposta.status).toBe(200);
    expect(axiosPost).not.toHaveBeenCalled();
  });
});
