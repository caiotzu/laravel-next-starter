import { describe, expect, it } from "vitest";

// @ts-expect-error script .mjs sem tipos (fora do tsconfig)
import { analisarAmbiente, temErro } from "../../scripts/verificar-producao.mjs";

type Problema = { nivel: string; chave: string; mensagem: string };

const valido = {
  NODE_ENV: "production",
  BACKEND_URL: "http://api-interna/api",
  FRONTEND_URL: "https://app.exemplo.com.br",
  TRUSTED_PROXY_HOPS: "1",
  REDIS_URL: "rediss://:senha@redis.interno:6380",
};

const chaves = (p: Problema[], nivel: string) => p.filter((x) => x.nivel === nivel).map((x) => x.chave);

describe("scripts/verificar-producao — regras das variáveis", () => {
  it("ambiente correto não gera problema", () => {
    expect(analisarAmbiente(valido)).toEqual([]);
  });

  it("NODE_ENV diferente de production é erro", () => {
    expect(chaves(analisarAmbiente({ ...valido, NODE_ENV: "development" }), "erro")).toEqual(["NODE_ENV"]);
  });

  it("FRONTEND_URL: http e localhost são erros; barra final é aviso", () => {
    expect(chaves(analisarAmbiente({ ...valido, FRONTEND_URL: "http://app.exemplo.com.br" }), "erro")).toEqual(["FRONTEND_URL"]);
    expect(chaves(analisarAmbiente({ ...valido, FRONTEND_URL: "https://localhost:3000" }), "erro")).toEqual(["FRONTEND_URL"]);
    expect(chaves(analisarAmbiente({ ...valido, FRONTEND_URL: "https://app.exemplo.com.br/" }), "aviso")).toEqual(["FRONTEND_URL"]);
  });

  it("BACKEND_URL ausente é erro; localhost é aviso", () => {
    expect(chaves(analisarAmbiente({ ...valido, BACKEND_URL: "" }), "erro")).toEqual(["BACKEND_URL"]);
    expect(chaves(analisarAmbiente({ ...valido, BACKEND_URL: "http://localhost/api" }), "aviso")).toEqual(["BACKEND_URL"]);
  });

  it("TRUSTED_PROXY_HOPS: 0 e inválido são erros; ausente e muito alto são avisos", () => {
    expect(chaves(analisarAmbiente({ ...valido, TRUSTED_PROXY_HOPS: "0" }), "erro")).toEqual(["TRUSTED_PROXY_HOPS"]);
    expect(chaves(analisarAmbiente({ ...valido, TRUSTED_PROXY_HOPS: "um" }), "erro")).toEqual(["TRUSTED_PROXY_HOPS"]);
    expect(chaves(analisarAmbiente({ ...valido, TRUSTED_PROXY_HOPS: undefined }), "aviso")).toEqual(["TRUSTED_PROXY_HOPS"]);
    expect(chaves(analisarAmbiente({ ...valido, TRUSTED_PROXY_HOPS: "5" }), "aviso")).toEqual(["TRUSTED_PROXY_HOPS"]);
  });

  it("REDIS_URL: sem TLS e sem senha são erros", () => {
    expect(analisarAmbiente({ ...valido, REDIS_URL: "redis://:senha@redis.interno:6379" }).map((x: Problema) => x.mensagem).join(" ")).toContain("rediss://");
    expect(chaves(analisarAmbiente({ ...valido, REDIS_URL: "rediss://redis.interno:6380" }), "erro")).toEqual(["REDIS_URL"]);
    expect(chaves(analisarAmbiente({ ...valido, REDIS_URL: undefined }), "erro")).toEqual(["REDIS_URL"]);
  });

  it("CSP_MODO=report-only é erro; outro valor é aviso", () => {
    expect(chaves(analisarAmbiente({ ...valido, CSP_MODO: "report-only" }), "erro")).toEqual(["CSP_MODO"]);
    expect(chaves(analisarAmbiente({ ...valido, CSP_MODO: "x" }), "aviso")).toEqual(["CSP_MODO"]);
  });

  it("temErro só é verdadeiro com erro", () => {
    expect(temErro([])).toBe(false);
    expect(temErro([{ nivel: "aviso" }])).toBe(false);
    expect(temErro([{ nivel: "erro" }])).toBe(true);
  });
});
