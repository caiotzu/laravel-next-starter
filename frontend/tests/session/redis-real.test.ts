/**
 * Integração com um Redis REAL. Roda quando `REDIS_URL` está definida (no CI há um serviço Redis;
 * localmente: `docker run -p 6379:6379 redis:7` e `REDIS_URL=redis://127.0.0.1:6379 npm test`).
 * Sem `REDIS_URL` os testes são PULADOS (e o Vitest avisa), nunca "passam" em silêncio.
 */
import Redis from "ioredis";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { GET as saude } from "@/app/api/health/route";

import { fecharConexaoRedis } from "@/lib/session/conexao";
import { PREFIXO_CHAVE_SESSAO, RedisSessionStore } from "@/lib/session/redis-store";
import { redisEstaSaudavel } from "@/lib/session/saude";
import { SessaoIndisponivelError } from "@/lib/session/tipos";

const URL_REDIS = process.env.REDIS_URL;
const executar = URL_REDIS ? describe : describe.skip;

executar("RedisSessionStore com Redis real", () => {
  let redis: Redis;
  let store: RedisSessionStore;

  beforeAll(async () => {
    redis = new Redis(URL_REDIS!);
    store = new RedisSessionStore(redis);
    await redis.ping();
  });

  afterAll(async () => {
    // limpa só o que estes testes criaram
    const chaves = await redis.keys(`${PREFIXO_CHAVE_SESSAO}*`);
    if (chaves.length) await redis.del(...chaves);
    await redis.quit();
  });

  it("cria, lê e destrói; a chave tem TTL nativo do Redis", async () => {
    const sid = await store.criar({ contexto: "admin", token: "jwt-real" }, 120);

    expect((await store.obter(sid))?.token).toBe("jwt-real");

    const ttl = await redis.ttl(`${PREFIXO_CHAVE_SESSAO}${sid}`);
    expect(ttl).toBeGreaterThan(100);
    expect(ttl).toBeLessThanOrEqual(120);

    await store.destruir(sid);
    expect(await store.obter(sid)).toBeNull();
    expect(await redis.exists(`${PREFIXO_CHAVE_SESSAO}${sid}`)).toBe(0);
  });

  it("a sessão EXPIRA de verdade no Redis (TTL de 1 s)", async () => {
    const sid = await store.criar({ contexto: "private", token: "jwt-curto" }, 1);
    expect(await store.obter(sid)).not.toBeNull();

    await new Promise((r) => setTimeout(r, 1600));

    expect(await store.obter(sid)).toBeNull();
    expect(await redis.exists(`${PREFIXO_CHAVE_SESSAO}${sid}`)).toBe(0);
  });

  it("o valor guardado no Redis é o JSON da sessão (e só ele leva o JWT)", async () => {
    const sid = await store.criar({ contexto: "admin", token: "jwt-no-servidor" }, 60);

    const bruto = await redis.get(`${PREFIXO_CHAVE_SESSAO}${sid}`);

    expect(JSON.parse(bruto!)).toEqual(expect.objectContaining({ contexto: "admin", token: "jwt-no-servidor" }));
    expect(sid).not.toContain("jwt-no-servidor"); // o identificador que vai ao navegador não carrega o token
  });

  it("200 usuários ao mesmo tempo: 200 sids distintos, cada um com o seu token, sem cruzamento", async () => {
    const sids = await Promise.all(
      Array.from({ length: 200 }, (_, i) => store.criar({ contexto: i % 2 ? "admin" : "private", token: `jwt-${i}` }, 60))
    );

    expect(new Set(sids).size).toBe(200);

    const dados = await Promise.all(sids.map((sid) => store.obter(sid)));

    dados.forEach((d, i) => {
      expect(d?.token).toBe(`jwt-${i}`);
      expect(d?.contexto).toBe(i % 2 ? "admin" : "private");
    });

    // derrubar metade não afeta a outra metade
    await Promise.all(sids.filter((_, i) => i % 2 === 0).map((sid) => store.destruir(sid)));
    const depois = await Promise.all(sids.map((sid) => store.obter(sid)));
    depois.forEach((d, i) => (i % 2 === 0 ? expect(d).toBeNull() : expect(d?.token).toBe(`jwt-${i}`)));
  });

  it("o mesmo usuário em vários computadores: sessões independentes (derrubar uma não derruba as outras)", async () => {
    const [casa, empresa, notebook] = await Promise.all(
      ["casa", "empresa", "notebook"].map((onde) => store.criar({ contexto: "private", token: `jwt-maria-${onde}` }, 60))
    );

    await store.destruir(casa);

    expect(await store.obter(casa)).toBeNull();
    expect((await store.obter(empresa))?.token).toBe("jwt-maria-empresa");
    expect((await store.obter(notebook))?.token).toBe("jwt-maria-notebook");
  });

  it("valor adulterado diretamente no Redis é recusado e removido", async () => {
    const sid = await store.criar({ contexto: "admin", token: "jwt" }, 60);
    await redis.set(`${PREFIXO_CHAVE_SESSAO}${sid}`, '{"contexto":"superadmin","token":"x"}', "EX", 60);

    expect(await store.obter(sid)).toBeNull();
    expect(await redis.exists(`${PREFIXO_CHAVE_SESSAO}${sid}`)).toBe(0);
  });

  it("Redis inacessível: falha RÁPIDO com SessaoIndisponivelError (não fica pendurado)", async () => {
    const quebrado = new Redis("redis://127.0.0.1:1", { maxRetriesPerRequest: 1, connectTimeout: 500, commandTimeout: 800, retryStrategy: () => null });
    quebrado.on("error", () => undefined);
    const lojaQuebrada = new RedisSessionStore(quebrado);

    const inicio = Date.now();
    const erro = await lojaQuebrada.criar({ contexto: "admin", token: "jwt" }, 60).catch((e: unknown) => e);

    expect(erro).toBeInstanceOf(SessaoIndisponivelError);
    expect(Date.now() - inicio).toBeLessThan(4000);
    quebrado.disconnect();
  });

  it("o verificador de saúde e GET /api/health falam com o Redis de verdade", async () => {
    expect(await redisEstaSaudavel()).toBe(true);

    const resposta = await saude();
    expect(resposta.status).toBe(200);
    expect(await resposta.json()).toEqual({ status: "ok", redis: "ok" });

    await fecharConexaoRedis();
  });

  it("com o Redis inacessível, GET /api/health responde 503 rápido", async () => {
    const original = process.env.REDIS_URL;
    process.env.REDIS_URL = "redis://127.0.0.1:1"; // porta onde não há Redis
    await fecharConexaoRedis();

    try {
      const inicio = Date.now();
      const resposta = await saude();

      expect(resposta.status).toBe(503);
      expect(await resposta.json()).toEqual({ status: "degradado", redis: "indisponivel" });
      expect(Date.now() - inicio).toBeLessThan(6000);
    } finally {
      process.env.REDIS_URL = original;
      await fecharConexaoRedis();
    }
  });
});
