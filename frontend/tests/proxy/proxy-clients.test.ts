import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { definirAcessoSuporteAtivo, obterAcessoSuporteAtivo } from "@/lib/acesso-suporte/acesso-suporte-storage";

vi.mock("axios", async () => {
  const actual = await vi.importActual<typeof import("axios")>("axios");
  return { ...actual, default: { ...actual.default, post: vi.fn() } };
});

const post = vi.mocked(axios.post);

const erro = (status: number) => Object.assign(new Error("x"), { response: { status, data: {} }, isAxiosError: true });

const clientes = [
  ["private", "/api/proxy/private", () => import("@/lib/proxy-private").then((m) => m.proxyPrivateRequest)],
  ["admin", "/api/proxy/admin", () => import("@/lib/proxy-admin").then((m) => m.proxyAdminRequest)],
] as const;

beforeEach(() => {
  post.mockReset();
  vi.resetModules();
});

describe.each(clientes)("proxy %s", (_nome, rota, carregar) => {
  it("chama a rota do BFF e normaliza URLs de /storage", async () => {
    post.mockResolvedValue({
      data: { status: 200, data: { data: { avatar: "http://localhost/storage/avatars/a.png" } } },
    });
    const req = await carregar();

    const res = await req<{ data: { avatar: string } }>({ url: "/me" });

    expect(post).toHaveBeenCalledWith(rota, { url: "/me", method: "GET", data: undefined, headers: {} });
    expect(res.data.data.avatar).toBe("/storage/avatars/a.png");
  });

  it("envia X-Acesso-Suporte-Id quando há acesso ativo", async () => {
    post.mockResolvedValue({ data: { status: 200, data: {} } });
    definirAcessoSuporteAtivo({ id: "id-1", entidadeNome: "A", expiraEm: null });
    const req = await carregar();

    await req({ url: "/x", method: "POST", data: { a: 1 } });

    expect(post.mock.calls[0][1]).toMatchObject({ method: "POST", data: { a: 1 }, headers: { "X-Acesso-Suporte-Id": "id-1" } });
  });

  it("403 com acesso de suporte limpa o acesso e rejeita", async () => {
    definirAcessoSuporteAtivo({ id: "id-1", entidadeNome: "A", expiraEm: null });
    post.mockRejectedValue(erro(403));
    const req = await carregar();

    await expect(req({ url: "/x" })).rejects.toBeTruthy();
    expect(obterAcessoSuporteAtivo()).toBeNull();
  });

  it("outros erros são repassados", async () => {
    post.mockRejectedValue(erro(422));
    const req = await carregar();

    await expect(req({ url: "/x" })).rejects.toMatchObject({ response: { status: 422 } });
  });
});
