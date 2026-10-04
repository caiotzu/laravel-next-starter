import { afterEach, describe, expect, it } from "vitest";

import { ipsEncaminhados, obterIpCliente } from "@/lib/client-ip";

const req = (headers: Record<string, string>) => new Request("http://x", { headers });

afterEach(() => {
  delete process.env.TRUSTED_PROXY_HOPS;
});

describe("obterIpCliente", () => {
  it("usa o último IP da cadeia por padrão (1 proxy confiável)", () => {
    expect(obterIpCliente(req({ "x-forwarded-for": "6.6.6.6, 203.0.113.5" }))).toBe("203.0.113.5");
  });

  it("respeita TRUSTED_PROXY_HOPS", () => {
    process.env.TRUSTED_PROXY_HOPS = "2";
    expect(obterIpCliente(req({ "x-forwarded-for": "198.51.100.1, 203.0.113.5, 10.0.0.1" }))).toBe("203.0.113.5");
  });

  it("com 0 saltos nada é repassado", () => {
    process.env.TRUSTED_PROXY_HOPS = "0";
    expect(obterIpCliente(req({ "x-forwarded-for": "203.0.113.5" }))).toBe("");
  });

  it("valor inválido de saltos volta ao padrão 1", () => {
    process.env.TRUSTED_PROXY_HOPS = "abc";
    expect(obterIpCliente(req({ "x-forwarded-for": "9.9.9.9, 203.0.113.5" }))).toBe("203.0.113.5");
  });

  it("ignora IP inválido e cai para x-real-ip válido", () => {
    expect(obterIpCliente(req({ "x-forwarded-for": "lixo", "x-real-ip": "203.0.113.9" }))).toBe("203.0.113.9");
    expect(obterIpCliente(req({ "x-forwarded-for": "lixo", "x-real-ip": "lixo" }))).toBe("");
    expect(obterIpCliente(req({}))).toBe("");
  });

  it("ipsEncaminhados devolve o mesmo valor nos dois headers", () => {
    expect(ipsEncaminhados(req({ "x-forwarded-for": "203.0.113.5" }))).toEqual({
      forwardedFor: "203.0.113.5",
      realIp: "203.0.113.5",
    });
  });
});
