import { afterEach, describe, expect, it } from "vitest";

import {
  cn,
  formatDate,
  formatDuration,
  maskCEP,
  maskCNPJ,
  maskCNPJAlfanumerico,
  maskPhone,
  onlyAlphaNumeric,
  onlyDigits,
  removeEmptyValues,
  validarOrigem,
} from "@/lib/utils";

describe("cn", () => {
  it("mescla classes resolvendo conflitos do tailwind", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("a", false && "b", "c")).toBe("a c");
  });
});

describe("formatDate", () => {
  it("devolve --- para vazio ou inválido", () => {
    expect(formatDate(null)).toBe("---");
    expect(formatDate(undefined)).toBe("---");
    expect(formatDate("nao-e-data")).toBe("---");
  });

  it("formata somente a data quando includeTime=false", () => {
    expect(formatDate("2026-03-05T12:00:00", false)).toBe("05/03/2026");
  });

  it("inclui a hora por padrão", () => {
    expect(formatDate("2026-03-05T12:30:00")).toMatch(/^05\/03\/2026 • \d{2}:\d{2}$/);
  });
});

describe("formatDuration", () => {
  it.each([
    [null, "---"],
    [undefined, "---"],
    [Number.NaN, "---"],
    [30, "< 1min"],
    [120, "2min"],
    [3600 * 5 + 60 * 30, "5h 30min"],
    [86400 * 2 + 3600 * 4, "2d 4h"],
  ])("%s -> %s", (entrada, esperado) => {
    expect(formatDuration(entrada as number | null | undefined)).toBe(esperado);
  });
});

describe("máscaras", () => {
  it("maskCNPJ", () => {
    expect(maskCNPJ("12345678000195")).toBe("12.345.678/0001-95");
    expect(maskCNPJ("123")).toBe("12.3");
    expect(maskCNPJ(null)).toBe("");
    expect(maskCNPJ("12.345.678/0001-95999")).toBe("12.345.678/0001-95");
  });

  it("maskCNPJAlfanumerico", () => {
    expect(maskCNPJAlfanumerico("ab3cd5ef0001zz")).toBe("AB.3CD.5EF/0001-ZZ");
  });

  it("onlyDigits e onlyAlphaNumeric", () => {
    expect(onlyDigits("(11) 9-8765")).toBe("1198765");
    expect(onlyDigits(null)).toBe("");
    expect(onlyAlphaNumeric("a-b.c 1!")).toBe("abc1");
  });

  it("maskCEP", () => {
    expect(maskCEP("01310100")).toBe("01310-100");
    expect(maskCEP("0131")).toBe("0131");
  });

  it("maskPhone fixo e celular", () => {
    expect(maskPhone("1133334444")).toBe("(11) 3333-4444");
    expect(maskPhone("11987654321")).toBe("(11) 98765-4321");
    expect(maskPhone("")).toBe("");
    expect(maskPhone("1")).toBe("(1");
  });
});

describe("removeEmptyValues", () => {
  it("remove undefined, null e string vazia, mantendo 0 e false", () => {
    expect(removeEmptyValues({ a: 1, b: "", c: null, d: undefined, e: 0, f: false })).toEqual({ a: 1, e: 0, f: false });
  });
});

describe("validarOrigem", () => {
  afterEach(() => {
    delete process.env.FRONTEND_URL;
  });

  const req = (headers: Record<string, string>) => new Request("http://x", { headers });

  it("aceita Origin igual ao FRONTEND_URL", () => {
    process.env.FRONTEND_URL = "http://localhost:3000";
    expect(validarOrigem(req({ origin: "http://localhost:3000" }))).toBeNull();
  });

  it("recusa Origin diferente com 403", async () => {
    process.env.FRONTEND_URL = "http://localhost:3000";
    const res = validarOrigem(req({ origin: "http://evil.com" }));
    expect(res?.status).toBe(403);
    expect(await res?.json()).toEqual({ errors: { business: ["Origem não permitida."] } });
  });

  it("sem Origin só aceita Sec-Fetch-Site same-origin", () => {
    process.env.FRONTEND_URL = "http://localhost:3000";
    expect(validarOrigem(req({ "sec-fetch-site": "same-origin" }))).toBeNull();
    expect(validarOrigem(req({}))?.status).toBe(403);
    expect(validarOrigem(req({ "sec-fetch-site": "cross-site" }))?.status).toBe(403);
  });

  it("sem FRONTEND_URL, com Origin, nega", () => {
    expect(validarOrigem(req({ origin: "http://localhost:3000" }))?.status).toBe(403);
  });
});
