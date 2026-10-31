import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { nomeCookieSessao, opcoesCookieSessao } from "@/lib/session/cookie";
import { PREFIXO_CHAVE_SESSAO, RedisSessionStore } from "@/lib/session/redis-store";
import { calcularTtlDaSessao } from "@/lib/session/sessao";
import { gerarSid, sidTemFormatoValido } from "@/lib/session/sid";
import { SessaoIndisponivelError } from "@/lib/session/tipos";

import { FakeRedis } from "../helpers/fake-redis";
import { jwtComExp } from "../helpers/sessao";

afterEach(() => vi.unstubAllEnvs());

describe("sid", () => {
  it("tem 256 bits de aleatoriedade em formato seguro para cookie e chave (43 caracteres base64url)", () => {
    const sid = gerarSid();

    expect(sid).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(sidTemFormatoValido(sid)).toBe(true);
  });

  it("não se repete (10 mil sorteios)", () => {
    expect(new Set(Array.from({ length: 10_000 }, gerarSid)).size).toBe(10_000);
  });

  it.each([undefined, null, 42, "", "curto", "a".repeat(42), "a".repeat(44), `${"a".repeat(42)}!`, `${"a".repeat(41)}../`, "a b".padEnd(43, "a")])(
    "recusa valor malformado: %s",
    (valor) => {
      expect(sidTemFormatoValido(valor)).toBe(false);
    }
  );
});

describe("cookie de sessão", () => {
  it("em produção usa o prefixo __Host- e atributos estritos (Secure, HttpOnly, Lax, Path=/, sem Domain)", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(nomeCookieSessao("admin")).toBe("__Host-admin_sid");
    expect(nomeCookieSessao("private")).toBe("__Host-private_sid");

    const opcoes = opcoesCookieSessao(900);
    expect(opcoes).toEqual({ httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 900 });
    expect(opcoes).not.toHaveProperty("domain"); // exigência do prefixo __Host-
  });

  it("fora de produção só o prefixo e o Secure mudam (http local); HttpOnly, SameSite e Path continuam", () => {
    vi.stubEnv("NODE_ENV", "development");

    expect(nomeCookieSessao("admin")).toBe("admin_sid");
    expect(opcoesCookieSessao(10)).toEqual({ httpOnly: true, secure: false, sameSite: "lax", path: "/", maxAge: 10 });
  });

  it("o nome do cookie não sugere token (não contém 'token' nem 'jwt')", () => {
    expect(nomeCookieSessao("admin")).not.toMatch(/token|jwt/i);
    expect(nomeCookieSessao("private")).not.toMatch(/token|jwt/i);
  });
});

describe("calcularTtlDaSessao", () => {
  const agora = 1_800_000_000;
  const jwtCom = (exp: number) => {
    const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");

    return `${b64({ alg: "HS256" })}.${b64({ exp })}.x`;
  };

  it("é o tempo restante do JWT", () => {
    expect(calcularTtlDaSessao(jwtCom(agora + 900), agora)).toBe(900);
  });

  it("sem exp ou token ilegível: 1 hora", () => {
    expect(calcularTtlDaSessao("lixo", agora)).toBe(3600);
    expect(calcularTtlDaSessao(jwtComExp(0).split(".").slice(0, 2).join(".") + ".x", agora)).toBeGreaterThan(0);
  });

  it("nunca passa de 12 horas, mesmo que o backend emita token mais longo", () => {
    expect(calcularTtlDaSessao(jwtCom(agora + 10 * 24 * 3600), agora)).toBe(12 * 3600);
  });

  it("token já expirado vira 1 segundo (a sessão nasce praticamente morta, nunca com TTL negativo)", () => {
    expect(calcularTtlDaSessao(jwtCom(agora - 500), agora)).toBe(1);
  });
});

describe("RedisSessionStore", () => {
  let redis: FakeRedis;
  let store: RedisSessionStore;

  beforeEach(() => {
    redis = new FakeRedis();
    store = new RedisSessionStore(redis);
  });

  it("grava sob bff:sess:<sid> com TTL e devolve os dados", async () => {
    const sid = await store.criar({ contexto: "admin", token: "jwt-1" }, 600);

    expect([...redis.dados.keys()]).toEqual([`${PREFIXO_CHAVE_SESSAO}${sid}`]);
    expect(await store.obter(sid)).toEqual(
      expect.objectContaining({ contexto: "admin", token: "jwt-1", expiraEm: expect.any(Number), criadaEm: expect.any(Number) })
    );
  });

  it("a sessão expira pelo TTL", async () => {
    vi.useFakeTimers();
    try {
      const sid = await store.criar({ contexto: "private", token: "jwt" }, 60);

      vi.advanceTimersByTime(59_000);
      expect(await store.obter(sid)).not.toBeNull();

      vi.advanceTimersByTime(2_000);
      expect(await store.obter(sid)).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("segunda barreira: mesmo que a chave ainda exista, expiraEm vencido invalida e remove", async () => {
    let agora = 1_000;
    const loja = new RedisSessionStore(redis, () => agora);
    const sid = await loja.criar({ contexto: "admin", token: "jwt" }, 100);

    agora = 1_101; // relógio da aplicação passou de expiraEm, o TTL do Redis ainda não
    expect(await loja.obter(sid)).toBeNull();
    expect(redis.total()).toBe(0);
  });

  it("ttl inválido (0, negativo, fracionado) vira no mínimo 1 segundo inteiro", async () => {
    const sid = await store.criar({ contexto: "admin", token: "jwt" }, -5);
    const dados = await store.obter(sid);

    expect(dados!.expiraEm - dados!.criadaEm).toBe(1);
  });

  it("destruir é idempotente", async () => {
    const sid = await store.criar({ contexto: "admin", token: "jwt" }, 60);

    await store.destruir(sid);
    await store.destruir(sid);

    expect(await store.obter(sid)).toBeNull();
  });

  it("sid malformado não chega ao Redis (obter e destruir)", async () => {
    expect(await store.obter("../outra-chave")).toBeNull();
    await store.destruir("bff:sess:*");

    expect(redis.comandos).toBe(0);
  });

  it.each([
    ["JSON corrompido", "{nao-e-json"],
    ["objeto sem os campos", JSON.stringify({ foo: "bar" })],
    ["contexto desconhecido", JSON.stringify({ contexto: "root", token: "t", criadaEm: 1, expiraEm: 9_999_999_999 })],
    ["token vazio", JSON.stringify({ contexto: "admin", token: "", criadaEm: 1, expiraEm: 9_999_999_999 })],
    ["expiraEm como texto", JSON.stringify({ contexto: "admin", token: "t", criadaEm: 1, expiraEm: "amanha" })],
    ["valor que não é objeto", JSON.stringify("string")],
    ["null", "null"],
  ])("valor inválido no Redis (%s) é tratado como sessão inexistente e apagado", async (_nome, valor) => {
    const sid = gerarSid();
    redis.dados.set(`${PREFIXO_CHAVE_SESSAO}${sid}`, { valor, expiraEmMs: Date.now() + 60_000 });

    expect(await store.obter(sid)).toBeNull();
    expect(redis.total()).toBe(0);
  });

  it("Redis fora do ar vira SessaoIndisponivelError SEM vazar a mensagem do driver nem o token", async () => {
    const sid = await store.criar({ contexto: "admin", token: "jwt-secreto" }, 60);
    redis.indisponivel = true;

    for (const operacao of [
      () => store.criar({ contexto: "admin", token: "jwt-secreto" }, 60),
      () => store.obter(sid),
      () => store.destruir(sid),
    ]) {
      const erro = await operacao().catch((e: unknown) => e);

      expect(erro).toBeInstanceOf(SessaoIndisponivelError);
      expect(String((erro as Error).message)).not.toMatch(/10\.0\.0\.1|segredo|jwt-secreto/);
    }
  });

  it("colisão de sid: nunca sobrescreve outra sessão (NX) e sorteia outro", async () => {
    // força a 1ª tentativa a colidir: a chave existe
    const existente = await store.criar({ contexto: "admin", token: "jwt-da-vitima" }, 60);
    const original = redis.set.bind(redis);
    let primeira = true;
    redis.set = async (chave, valor, modo, segundos, cond) => {
      if (primeira) {
        primeira = false;
        return original(`${PREFIXO_CHAVE_SESSAO}${existente}`, valor, modo, segundos, cond); // colide
      }

      return original(chave, valor, modo, segundos, cond);
    };

    const novo = await store.criar({ contexto: "private", token: "jwt-novo" }, 60);

    expect(novo).not.toBe(existente);
    expect((await store.obter(existente))?.token).toBe("jwt-da-vitima");
    expect((await store.obter(novo))?.token).toBe("jwt-novo");
  });
});
