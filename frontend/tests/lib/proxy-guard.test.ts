import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { filtrarHeadersCliente, metodoPermitido, resolverUrlBackend } from "@/lib/proxy-guard";

beforeEach(() => {
  process.env.BACKEND_URL = "http://localhost/api";
});
afterEach(() => {
  delete process.env.BACKEND_URL;
});

describe("metodoPermitido", () => {
  it("normaliza e valida", () => {
    expect(metodoPermitido("get")).toBe("GET");
    expect(metodoPermitido(undefined)).toBe("GET");
    expect(metodoPermitido("patch")).toBe("PATCH");
    expect(metodoPermitido("TRACE")).toBeNull();
    expect(metodoPermitido("CONNECT")).toBeNull();
  });
});

describe("resolverUrlBackend", () => {
  it("monta a URL dentro do prefixo da API", () => {
    expect(resolverUrlBackend("/usuarios?page=2")).toBe("http://localhost/api/usuarios?page=2");
    expect(resolverUrlBackend("/busca?q=a%2Fb")).toBe("http://localhost/api/busca?q=a%2Fb");
  });

  it.each(["usuarios", "//evil.com/x", "/a\\b", "/a\u0000b", "/%2e%2e/etc", "/a%2Fb", "/a%5Cb", 123, null])(
    "recusa caminho suspeito %s",
    (caminho) => {
      expect(resolverUrlBackend(caminho)).toBeNull();
    }
  );

  it("recusa quando escapa do prefixo /api", () => {
    expect(resolverUrlBackend("/../admin")).toBeNull();
  });

  it("sem BACKEND_URL retorna null", () => {
    delete process.env.BACKEND_URL;
    expect(resolverUrlBackend("/x")).toBeNull();
  });
});

describe("resolverUrlBackend — endpoints de autenticação (o JWT não pode voltar ao navegador pelo proxy)", () => {
  it("o proxy comum continua funcionando para rotas normais", () => {
    expect(resolverUrlBackend("/admin/usuarios")).toBe("http://localhost/api/admin/usuarios");
    expect(resolverUrlBackend("/usuarios/login-historico")).toBe("http://localhost/api/usuarios/login-historico");
    expect(resolverUrlBackend("/admin/usuarios/refresh")).toBe("http://localhost/api/admin/usuarios/refresh");
  });

  it.each([
    "/admin/refresh",
    "/refresh",
    "/admin/login",
    "/login",
    "/admin/2fa/verificar",
    "/2fa/verificar",
    "/admin/logout",
    "/logout",
    // variações que o servidor trataria como a mesma rota
    "/admin/refresh/",
    "/admin/refresh?x=1",
    "/admin/refresh#frag",
    "/ADMIN/Refresh",
    "/admin//refresh",
    "/admin/refre%73h", // %73 = "s"
    "/admin/%72efresh",
    "/%61dmin/refresh",
    "/admin/2fa%2Fverificar".replace("%2F", "/"),
    "/admin/refre%zzsh", // percent-encoding malformado
  ])("recusa %s", (caminho) => {
    expect(resolverUrlBackend(caminho)).toBeNull();
  });
});

describe("resolverUrlBackend — ponto e vírgula no caminho (F-13a)", () => {
  it.each(["/..;/admin/usuarios", "/admin;x=1/usuarios", "/admin/usuarios;jsessionid=1", "/admin/%3Busuarios", "/admin/%3busuarios"])("recusa %s", (caminho) => {
    expect(resolverUrlBackend(caminho)).toBeNull();
  });

  it("`;` na QUERY (busca com ponto e vírgula) continua permitido", () => {
    expect(resolverUrlBackend("/admin/usuarios?busca=a;b")).toBe("http://localhost/api/admin/usuarios?busca=a;b");
  });
});

describe("filtrarHeadersCliente", () => {
  const uuid = "123e4567-e89b-12d3-a456-426614174000";

  it("deixa passar apenas X-Acesso-Suporte-Id válido", () => {
    expect(
      filtrarHeadersCliente({
        "x-acesso-suporte-id": uuid,
        Authorization: "Bearer x",
        "X-Forwarded-For": "1.1.1.1",
      })
    ).toEqual({ "X-Acesso-Suporte-Id": uuid });
  });

  it("descarta UUID inválido, valor não string e entradas inválidas", () => {
    expect(filtrarHeadersCliente({ "X-Acesso-Suporte-Id": "abc" })).toEqual({});
    expect(filtrarHeadersCliente({ "X-Acesso-Suporte-Id": 1 })).toEqual({});
    expect(filtrarHeadersCliente(null)).toEqual({});
    expect(filtrarHeadersCliente("x")).toEqual({});
  });
});
