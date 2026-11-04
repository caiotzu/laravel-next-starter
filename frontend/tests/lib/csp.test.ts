import { describe, expect, it } from "vitest";

import {
  cabecalhoDaCsp,
  construirCsp,
  gerarNonce,
  origemDoBackend,
  rotaRecebeCspComNonce,
} from "@/lib/security/csp";

function diretiva(csp: string, nome: string): string[] {
  const linha = csp.split("; ").find((d) => d.startsWith(`${nome} `) || d === nome);

  return linha ? linha.split(" ").slice(1) : [];
}

describe("gerarNonce", () => {
  it("é base64 de 128 bits e não repete (5 mil sorteios)", () => {
    const nonce = gerarNonce();

    expect(nonce).toMatch(/^[A-Za-z0-9+/]{22}==$/);
    expect(new Set(Array.from({ length: 5000 }, gerarNonce)).size).toBe(5000);
  });
});

describe("construirCsp (produção)", () => {
  const csp = construirCsp({ nonce: "NONCE123==", producao: true, origemBackend: "https://api.exemplo.com" });

  it("scripts: só 'self', o nonce desta requisição e strict-dynamic; nada de inline ou eval", () => {
    expect(diretiva(csp, "script-src")).toEqual(["'self'", "'nonce-NONCE123=='", "'strict-dynamic'"]);
    expect(diretiva(csp, "script-src")).not.toContain("'unsafe-inline'");
    expect(diretiva(csp, "script-src")).not.toContain("'unsafe-eval'");
  });

  it("não há curinga nem esquemas amplos em nenhuma diretiva de execução/rede", () => {
    for (const nome of ["default-src", "script-src", "connect-src", "frame-src", "object-src", "worker-src"]) {
      const valores = diretiva(csp, nome);

      expect(valores, nome).not.toContain("*");
      expect(valores, nome).not.toContain("https:");
      expect(valores, nome).not.toContain("http:");
      expect(valores, nome).not.toContain("data:");
    }
  });

  it("fecha embutir, plugins, <base> e <form> de terceiros", () => {
    expect(diretiva(csp, "frame-ancestors")).toEqual(["'none'"]);
    expect(diretiva(csp, "frame-src")).toEqual(["'none'"]);
    expect(diretiva(csp, "object-src")).toEqual(["'none'"]);
    expect(diretiva(csp, "base-uri")).toEqual(["'self'"]);
    expect(diretiva(csp, "form-action")).toEqual(["'self'"]);
  });

  it("o navegador só fala com o próprio site (connect-src 'self')", () => {
    expect(diretiva(csp, "connect-src")).toEqual(["'self'"]);
  });

  it("imagens: o site, data:, blob: e a origem do backend (anexos assinados)", () => {
    expect(diretiva(csp, "img-src")).toEqual(["'self'", "data:", "blob:", "https://api.exemplo.com"]);
  });

  it("estilos: 'unsafe-inline' (React/Radix/Recharts usam style), mas nada de hosts externos", () => {
    expect(diretiva(csp, "style-src")).toEqual(["'self'", "'unsafe-inline'"]);
  });

  it("sem origem do backend, imagens só do próprio site", () => {
    expect(diretiva(construirCsp({ nonce: "x", producao: true }), "img-src")).toEqual(["'self'", "data:", "blob:"]);
  });

  it("o nonce entra só em script-src", () => {
    expect(csp.match(/nonce-/g)).toHaveLength(1);
  });
});

describe("construirCsp (desenvolvimento)", () => {
  const csp = construirCsp({ nonce: "N==", producao: false });

  it("libera eval e WebSocket só no desenvolvimento (React dev e hot reload)", () => {
    expect(diretiva(csp, "script-src")).toContain("'unsafe-eval'");
    expect(diretiva(csp, "connect-src")).toEqual(["'self'", "ws:", "wss:"]);
  });

  it("continua sem 'unsafe-inline' em scripts", () => {
    expect(diretiva(csp, "script-src")).not.toContain("'unsafe-inline'");
  });
});

describe("origemDoBackend", () => {
  it.each([
    ["http://localhost/api", "http://localhost"],
    ["https://api.exemplo.com/api", "https://api.exemplo.com"],
    ["http://backend:8080/api/", "http://backend:8080"],
  ])("%s → %s", (entrada, esperado) => {
    expect(origemDoBackend(entrada)).toBe(esperado);
  });

  it.each([undefined, "", "isto não é url", "javascript:alert(1)//"])("%s → null (ou origem opaca recusada)", (entrada) => {
    const origem = origemDoBackend(entrada as string | undefined);

    expect(origem === null || origem === "null").toBe(true);
  });
});

describe("cabecalhoDaCsp", () => {
  it("padrão bloqueia; CSP_MODO=report-only só reporta", () => {
    expect(cabecalhoDaCsp(undefined)).toBe("Content-Security-Policy");
    expect(cabecalhoDaCsp("enforce")).toBe("Content-Security-Policy");
    expect(cabecalhoDaCsp("")).toBe("Content-Security-Policy");
    expect(cabecalhoDaCsp("report-only")).toBe("Content-Security-Policy-Report-Only");
    expect(cabecalhoDaCsp("  Report-Only ")).toBe("Content-Security-Policy-Report-Only");
  });
});

describe("rotaRecebeCspComNonce", () => {
  it("páginas sim; API, assets do Next e storage não", () => {
    for (const p of ["/", "/admin", "/admin/home", "/usuarios/123", "/perfil"]) expect(rotaRecebeCspComNonce(p), p).toBe(true);
    for (const p of ["/api/health", "/api/proxy/admin", "/api", "/_next/static/chunks/a.js", "/storage/avatars/a.png"]) expect(rotaRecebeCspComNonce(p), p).toBe(false);
  });
});
