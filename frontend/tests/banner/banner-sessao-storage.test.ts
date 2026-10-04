import { describe, expect, it } from "vitest";

import {
  consumirBannerPendente,
  existeBannerPendente,
  marcarNovoLogin,
} from "@/lib/banner/banner-sessao-storage";

describe("banner-sessao-storage", () => {
  it("não há banner pendente sem login", () => {
    expect(existeBannerPendente("private")).toBe(false);
  });

  it("o login arma o sinal e consumir o desarma (uso único)", () => {
    marcarNovoLogin("private");
    expect(existeBannerPendente("private")).toBe(true);

    consumirBannerPendente("private");
    expect(existeBannerPendente("private")).toBe(false);
  });

  it("separa os sinais de admin e private", () => {
    marcarNovoLogin("admin");
    expect(existeBannerPendente("admin")).toBe(true);
    expect(existeBannerPendente("private")).toBe(false);
  });

  it("um novo login arma o sinal novamente", () => {
    marcarNovoLogin("admin");
    consumirBannerPendente("admin");
    marcarNovoLogin("admin");
    expect(existeBannerPendente("admin")).toBe(true);
  });
});
