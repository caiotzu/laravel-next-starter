import { describe, expect, it, vi } from "vitest";

import { marcarNovoLoginSocial, existeBannerPendente } from "@/lib/banner/banner-sessao-storage";
import {
  caminhoBackendSocial,
  codigoErroPorStatus,
  mensagemErroSocial,
  nomeCookieSocial,
  urlAutorizacaoValida,
} from "@/lib/social/social";

describe("social", () => {
  it("monta o caminho do backend por contexto", () => {
    expect(caminhoBackendSocial("admin", "google/iniciar")).toBe("/admin/login/social/google/iniciar");
    expect(caminhoBackendSocial("private", "google/iniciar")).toBe("/login/social/google/iniciar");
  });

  it("usa o prefixo __Host- só em produção", () => {
    expect(nomeCookieSocial("admin")).toBe("admin_social");

    vi.stubEnv("NODE_ENV", "production");
    expect(nomeCookieSocial("private")).toBe("__Host-private_social");
    vi.unstubAllEnvs();
  });

  it("só converte em mensagem códigos conhecidos de erro social", () => {
    expect(mensagemErroSocial("social_negado")).toContain("autorizada");
    expect(mensagemErroSocial("social_cancelado")).toBeTruthy();
    expect(mensagemErroSocial("social_<script>")).toBeNull();
    expect(mensagemErroSocial("social_constructor")).toBeNull();
    expect(mensagemErroSocial("social___proto__")).toBeNull();
    expect(mensagemErroSocial("qualquer")).toBeNull();
    expect(mensagemErroSocial(null)).toBeNull();
  });

  it("mapeia status do backend em código de erro", () => {
    expect(codigoErroPorStatus(401)).toBe("negado");
    expect(codigoErroPorStatus(429)).toBe("limite");
    expect(codigoErroPorStatus(503)).toBe("indisponivel");
    expect(codigoErroPorStatus(422)).toBe("expirado");
    expect(codigoErroPorStatus(400)).toBe("expirado");
  });

  it("só aceita URL https do provedor (http fora de produção)", () => {
    expect(urlAutorizacaoValida("https://accounts.google.com/x")).toBe(true);
    expect(urlAutorizacaoValida("javascript:alert(1)")).toBe(false);
    expect(urlAutorizacaoValida("not a url")).toBe(false);
    expect(urlAutorizacaoValida(undefined)).toBe(false);

    vi.stubEnv("NODE_ENV", "production");
    expect(urlAutorizacaoValida("http://accounts.google.com/x")).toBe(false);
    vi.unstubAllEnvs();
  });
});

describe("marcarNovoLoginSocial", () => {
  it("arma o sinal do Banner e remove o parâmetro da URL", () => {
    window.sessionStorage.clear();
    window.history.replaceState(null, "", "/admin/home?login_social=1&x=2#h");

    marcarNovoLoginSocial("admin");

    expect(existeBannerPendente("admin")).toBe(true);
    expect(window.location.search).toBe("?x=2");
    expect(window.location.hash).toBe("#h");
  });

  it("não arma o sinal sem o parâmetro", () => {
    window.sessionStorage.clear();
    window.history.replaceState(null, "", "/admin/home");

    marcarNovoLoginSocial("admin");

    expect(existeBannerPendente("admin")).toBe(false);
  });

  it("ignora valor diferente de 1", () => {
    window.sessionStorage.clear();
    window.history.replaceState(null, "", "/admin/home?login_social=0");

    marcarNovoLoginSocial("admin");

    expect(existeBannerPendente("admin")).toBe(false);
  });
});

describe("vínculo (perfil)", () => {
  it("interpreta só resultados conhecidos de ?vinculo=", async () => {
    const { interpretarResultadoVinculo } = await import("@/lib/social/social");

    expect(interpretarResultadoVinculo("ok")).toEqual({ tipo: "sucesso", mensagem: "Conta vinculada com sucesso!" });
    expect(interpretarResultadoVinculo("invalido")?.tipo).toBe("erro");
    expect(interpretarResultadoVinculo("cancelado")?.tipo).toBe("erro");
    expect(interpretarResultadoVinculo("<script>")).toBeNull();
    expect(interpretarResultadoVinculo("constructor")).toBeNull();
    expect(interpretarResultadoVinculo("__proto__")).toBeNull();
    expect(interpretarResultadoVinculo(null)).toBeNull();
  });

  it("mapeia status em resultado e monta caminhos", async () => {
    const m = await import("@/lib/social/social");

    expect(m.resultadoVinculoPorStatus(429)).toBe("limite");
    expect(m.resultadoVinculoPorStatus(502)).toBe("indisponivel");
    expect(m.resultadoVinculoPorStatus(422)).toBe("invalido");
    expect(m.resultadoVinculoPorStatus(400)).toBe("invalido");
    expect(m.caminhoBackendPerfilSocial("admin", "google/vincular/iniciar")).toBe("/admin/perfil/login-social/google/vincular/iniciar");
    expect(m.caminhoBackendPerfilSocial("private", "google")).toBe("/perfil/login-social/google");
    expect(m.nomeCookieVinculo("admin")).toBe("admin_social_vinculo");
  });
});
