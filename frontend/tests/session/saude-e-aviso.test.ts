import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const redisFalso = vi.hoisted(() => ({ ping: vi.fn() }));

vi.mock("@/lib/session/conexao", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/session/conexao")>();

  return { ...original, obterConexaoRedis: vi.fn(() => redisFalso) };
});

import { GET } from "@/app/api/health/route";

import { redisEstaSaudavel } from "@/lib/session/saude";

describe("redisEstaSaudavel", () => {
  beforeEach(() => {
    redisFalso.ping.mockReset();
  });

  it("verdadeiro quando o Redis responde PONG", async () => {
    redisFalso.ping.mockResolvedValue("PONG");

    expect(await redisEstaSaudavel()).toBe(true);
  });

  it("falso quando o PING falha, estoura o tempo ou volta algo inesperado", async () => {
    redisFalso.ping.mockRejectedValue(new Error("Command timed out (senha=segredo)"));
    expect(await redisEstaSaudavel()).toBe(false);

    redisFalso.ping.mockResolvedValue("LOADING");
    expect(await redisEstaSaudavel()).toBe(false);
  });
});

describe("GET /api/health", () => {
  beforeEach(() => {
    redisFalso.ping.mockReset();
  });

  it("200 quando o Redis está de pé", async () => {
    redisFalso.ping.mockResolvedValue("PONG");

    const resposta = await GET();

    expect(resposta.status).toBe(200);
    expect(await resposta.json()).toEqual({ status: "ok", redis: "ok" });
    expect(resposta.headers.get("cache-control")).toBe("no-store");
  });

  it("503 quando o Redis está fora do ar, sem vazar detalhes", async () => {
    redisFalso.ping.mockRejectedValue(new Error("connect ECONNREFUSED 10.0.0.9:6379 senha=segredo"));

    const resposta = await GET();
    const texto = await resposta.text();

    expect(resposta.status).toBe(503);
    expect(JSON.parse(texto)).toEqual({ status: "degradado", redis: "indisponivel" });
    expect(texto).not.toMatch(/10\.0\.0\.9|ECONNREFUSED|segredo/);
    expect(resposta.headers.get("cache-control")).toBe("no-store");
  });
});

describe("aviso de REDIS_URL ausente (conexao.ts real)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    (globalThis as { __bffRedisUltimoAvisoUrl?: number }).__bffRedisUltimoAvisoUrl = undefined;
    (globalThis as { __bffRedis?: unknown }).__bffRedis = undefined;
  });

  it("escreve no terminal o que fazer e lança SessaoIndisponivelError; repetido em seguida não inunda o log", async () => {
    const { obterConexaoRedis } = await vi.importActual<typeof import("@/lib/session/conexao")>("@/lib/session/conexao");
    const { SessaoIndisponivelError } = await import("@/lib/session/tipos");
    vi.stubEnv("REDIS_URL", "");
    const erro = vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(() => obterConexaoRedis()).toThrow(SessaoIndisponivelError);
    expect(() => obterConexaoRedis()).toThrow(SessaoIndisponivelError);
    expect(() => obterConexaoRedis()).toThrow(SessaoIndisponivelError);

    expect(erro).toHaveBeenCalledTimes(1); // limitado a 1 aviso a cada 10 s
    expect(String(erro.mock.calls[0][0])).toContain("REDIS_URL");
    expect(String(erro.mock.calls[0][0])).toContain("frontend/.env");
  });

  it("volta a avisar depois de 10 segundos", async () => {
    const { obterConexaoRedis } = await vi.importActual<typeof import("@/lib/session/conexao")>("@/lib/session/conexao");
    vi.stubEnv("REDIS_URL", "");
    const erro = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.useFakeTimers();

    try {
      expect(() => obterConexaoRedis()).toThrow();
      vi.advanceTimersByTime(10_001);
      expect(() => obterConexaoRedis()).toThrow();

      expect(erro).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });
});
