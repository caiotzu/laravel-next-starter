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
