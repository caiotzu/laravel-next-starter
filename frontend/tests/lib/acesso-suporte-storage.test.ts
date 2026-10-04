import { describe, expect, it, vi } from "vitest";

import {
  assinarAlteracoesAcessoSuporte,
  definirAcessoSuporteAtivo,
  limparAcessoSuporteAtivo,
  obterAcessoSuporteAtivo,
} from "@/lib/acesso-suporte/acesso-suporte-storage";

describe("acesso-suporte-storage", () => {
  it("retorna null sem acesso", () => {
    expect(obterAcessoSuporteAtivo()).toBeNull();
  });

  it("define, lê e limpa o acesso", () => {
    const futuro = new Date(Date.now() + 3_600_000).toISOString();
    definirAcessoSuporteAtivo({ id: "1", entidadeNome: "Acme", expiraEm: futuro });
    expect(obterAcessoSuporteAtivo()).toEqual({ id: "1", entidadeNome: "Acme", expiraEm: futuro });

    limparAcessoSuporteAtivo();
    expect(obterAcessoSuporteAtivo()).toBeNull();
  });

  it("descarta acesso expirado", () => {
    const passado = new Date(Date.now() - 1000).toISOString();
    definirAcessoSuporteAtivo({ id: "1", entidadeNome: "Acme", expiraEm: passado });
    expect(obterAcessoSuporteAtivo()).toBeNull();
    expect(window.sessionStorage.getItem("acesso_suporte_ativo")).toBeNull();
  });

  it("aceita expiraEm nulo", () => {
    definirAcessoSuporteAtivo({ id: "2", entidadeNome: "X", expiraEm: null });
    expect(obterAcessoSuporteAtivo()?.id).toBe("2");
  });

  it("JSON inválido retorna null", () => {
    window.sessionStorage.setItem("acesso_suporte_ativo", "{quebrado");
    expect(obterAcessoSuporteAtivo()).toBeNull();
  });

  it("notifica assinantes e permite cancelar a assinatura", () => {
    const cb = vi.fn();
    const cancelar = assinarAlteracoesAcessoSuporte(cb);

    definirAcessoSuporteAtivo({ id: "1", entidadeNome: "A", expiraEm: null });
    limparAcessoSuporteAtivo();
    expect(cb).toHaveBeenCalledTimes(2);

    cancelar();
    limparAcessoSuporteAtivo();
    expect(cb).toHaveBeenCalledTimes(2);
  });
});
