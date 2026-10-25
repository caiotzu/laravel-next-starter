import { describe, expect, it } from "vitest";

import { separarTokenDeSessao } from "@/lib/auth-response";

describe("separarTokenDeSessao", () => {
  it("separa o token e preserva os demais campos, inclusive temp_token", () => {
    expect(separarTokenDeSessao({ token: "jwt", token_type: "bearer", temp_token: "t", usuario: { id: 1 } })).toEqual({
      token: "jwt",
      dadosPublicos: { token_type: "bearer", temp_token: "t", usuario: { id: 1 } },
    });
  });

  it("não altera o objeto recebido", () => {
    const original = { token: "jwt", nome: "Maria" };

    separarTokenDeSessao(original);

    expect(original).toEqual({ token: "jwt", nome: "Maria" });
  });

  it("devolve token nulo quando ele não existe, está vazio ou não é texto", () => {
    expect(separarTokenDeSessao({ "2fa_enable": true }).token).toBeNull();
    expect(separarTokenDeSessao({ token: "" }).token).toBeNull();
    expect(separarTokenDeSessao({ token: 123 }).token).toBeNull();
  });

  it("tolera dados ausentes ou de formato inesperado", () => {
    for (const entrada of [undefined, null, "texto", 42, ["token"]]) {
      expect(separarTokenDeSessao(entrada)).toEqual({ token: null, dadosPublicos: null });
    }
  });
});
